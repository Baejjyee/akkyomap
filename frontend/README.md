# React + TypeScript + Vite

## Auth/JWT 연동

프론트엔드는 Vite proxy를 유지하며 `/api` 상대 경로로 백엔드를 호출합니다.

```bash
npm run dev
```

인증 흐름:

- `/signup`에서 회원가입
- `/login`에서 로그인
- 로그인 성공 시 `localStorage`의 `akkyomap.accessToken`에 access token 저장
- Axios interceptor가 `Authorization: Bearer {token}` 헤더를 자동 첨부
- 앱 시작 시 `/api/auth/me`로 로그인 상태 복원
- 401 응답 시 저장된 access token 삭제

주요 화면:

```text
/: 공개 지도
/login: 로그인
/signup: 회원가입
/my/places: 내 장소 목록
/my/places/:placeId/edit: 내 장소 수정
/admin/places/pending: 관리자 승인/반려
```

관리자 화면은 `user.role === 'ADMIN'`인 계정만 접근합니다. 로컬 개발에서는 백엔드 DB의 `users.role`을 `ADMIN`으로 직접 변경해 테스트합니다.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
