const messages = {
  en: {
    errors: {
      validation: 'Validation error',
      notFound: 'Resource not found',
      unauthorized: 'Unauthorized',
      forbidden: 'Forbidden',
      internalError: 'Internal server error',
    },
    auth: {
      loginSuccess: 'Login successful',
      logoutSuccess: 'Logout successful',
      registerSuccess: 'Registration successful',
      invalidCredentials: 'Invalid credentials',
      emailExists: 'Email already registered',
      passwordUpdated: 'Password updated successfully',
    },
  },
  zh: {
    errors: {
      validation: '验证错误',
      notFound: '资源不存在',
      unauthorized: '未授权',
      forbidden: '禁止访问',
      internalError: '服务器内部错误',
    },
    auth: {
      loginSuccess: '登录成功',
      logoutSuccess: '退出成功',
      registerSuccess: '注册成功',
      invalidCredentials: '凭证无效',
      emailExists: '邮箱已注册',
      passwordUpdated: '密码更新成功',
    },
  },
  ja: {
    errors: {
      validation: 'バリデーションエラー',
      notFound: 'リソースが見つかりません',
      unauthorized: '未認証',
      forbidden: 'アクセス禁止',
      internalError: '内部サーバーエラー',
    },
    auth: {
      loginSuccess: 'ログイン成功',
      logoutSuccess: 'ログアウト成功',
      registerSuccess: '登録成功',
      invalidCredentials: '認証情報が無効です',
      emailExists: 'メールは既に登録されています',
      passwordUpdated: 'パスワードが更新されました',
    },
  },
  ko: {
    errors: {
      validation: '유효성 검사 오류',
      notFound: '리소스를 찾을 수 없습니다',
      unauthorized: '인증되지 않음',
      forbidden: '접근 금지',
      internalError: '내부 서버 오류',
    },
    auth: {
      loginSuccess: '로그인 성공',
      logoutSuccess: '로그아웃 성공',
      registerSuccess: '등록 성공',
      invalidCredentials: '인증 정보가 유효하지 않습니다',
      emailExists: '이메일이 이미 등록되었습니다',
      passwordUpdated: '비밀번호가 업데이트되었습니다',
    },
  },
}

function t(key, lang = 'en') {
  const keys = key.split('.')
  let value = messages[lang] || messages.en

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  return value || key
}

function getLanguage(req) {
  return req.headers['accept-language']?.split(',')[0]?.substring(0, 2) || 'en'
}

function i18nMiddleware(req, res, next) {
  req.t = (key) => t(key, getLanguage(req))
  next()
}

module.exports = { t, getLanguage, i18nMiddleware, messages }
