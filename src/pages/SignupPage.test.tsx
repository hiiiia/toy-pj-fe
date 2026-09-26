import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { SignupRequest, User } from '../api/types';
import { useAuth } from '../context/AuthContext';
import SignupPage from './SignupPage';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

/** signup 동작을 테스트마다 주입해 화면을 그린다 */
function renderPage(signup: (body: SignupRequest) => Promise<User>) {
  const signupMock = vi.fn(signup);
  vi.mocked(useAuth).mockReturnValue({
    status: 'anonymous',
    user: null,
    isAdmin: false,
    login: vi.fn(),
    signup: signupMock,
    logout: vi.fn(),
    changePassword: vi.fn(),
  });
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
  return signupMock;
}

async function fillForm(password: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('이름'), '신입');
  await user.type(screen.getByLabelText('이메일'), 'new@daon.example');
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.type(screen.getByLabelText('비밀번호 확인'), confirm);
  return user;
}

const neverCalled = async (): Promise<User> => {
  throw new Error('호출되면 안 됨');
};

describe('회원가입 화면', () => {
  it('비밀번호 규칙을 지키지 않으면 가입 버튼이 비활성화된다', async () => {
    renderPage(neverCalled);
    await fillForm('12345678', '12345678');
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled();
  });

  it('비밀번호 확인이 다르면 안내하고 가입할 수 없다', async () => {
    renderPage(neverCalled);
    await fillForm('password1', 'password2');
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled();
  });

  it('올바르게 입력하면 입력값으로 가입을 요청한다', async () => {
    const signup = renderPage(async () => ({}) as User);
    const user = await fillForm('password1', 'password1');

    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(signup).toHaveBeenCalledWith({ name: '신입', email: 'new@daon.example', password: 'password1', department: undefined });
  });

  it('서버가 거절하면(이메일 중복 등) 서버 메시지를 보여준다', async () => {
    renderPage(async () => {
      throw new ApiError(409, 'U002', '이미 등록된 이메일입니다.');
    });
    const user = await fillForm('password1', 'password1');

    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 등록된 이메일입니다.');
  });
});
