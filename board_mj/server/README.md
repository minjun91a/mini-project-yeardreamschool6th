# 게시판 API 서버

Express 5 + Mongoose 9 + MongoDB, JWT 인증 기반 게시판 REST API

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 런타임 | Node.js 20+ |
| 프레임워크 | Express 5 |
| 데이터베이스 | MongoDB + Mongoose 9 |
| 인증 | JSON Web Token (jsonwebtoken) |
| 비밀번호 | bcrypt (salt rounds 10) |

## 실행 방법

```bash
npm install
cp .env.example .env    # 값을 채운 뒤 실행
npm run dev
```

JWT 시크릿 생성:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 환경변수

| 키 | 설명 | 예시 |
|---|---|---|
| PORT | 서버 포트 | 80 |
| MONGO_URL | MongoDB 접속 주소 | mongodb://localhost:27017/board |
| JWT_SECRET | 토큰 서명 키 (128자 hex) | (randomBytes로 생성) |
| CORS_ORIGIN | 허용할 프론트 주소 | http://localhost:3000 |
| NODE_ENV | 실행 환경 | development |

## 폴더 구조

```
src/
├─ server.js          진입점 (DB 연결 후 listen)
├─ app.js             미들웨어 및 라우터 등록
├─ db.js              mongoose 연결
├─ models/            User, Post, Comment
├─ routes/            auth, posts, comments
└─ middlewares/
   ├─ auth.js         JWT 검증
   └─ error.js        전역 에러 핸들러
```

`app.js`와 `server.js`를 분리한 이유는 통합 테스트(supertest)에서 실제 포트를 열지 않고 `app` 객체만 사용하기 위함.

## 응답 규격

모든 응답은 아래 두 형태 중 하나를 따른다.

```json
{ "success": true, "data": { } }
```
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "없는 게시글입니다." } }
```

HTTP 상태 코드를 실제 의미대로 사용하므로, 클라이언트는 `res.ok` 또는 axios의 `catch`로 실패를 판별할 수 있다.

## API

Base URL: `http://localhost`
인증이 필요한 요청은 `Authorization: Bearer <token>` 헤더 필요 (만료 1시간)

### 인증

| 메서드 | 경로 | 인증 | 요청 body | 성공 | 실패 |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | - | `{id, pw, name}` | 201 `{user}` | 400, 409 |
| POST | `/api/auth/login` | - | `{id, pw}` | 200 `{token, user}` | 400, 401 |
| GET | `/api/auth/me` | ✔ | - | 200 `{user}` | 401 |

`user` 객체는 항상 `{_id, id, name, grade, createdAt}` 형태이며 **비밀번호는 어떤 응답에도 포함되지 않는다.**

### 게시글

| 메서드 | 경로 | 인증 | 요청 | 성공 | 실패 |
|---|---|---|---|---|---|
| GET | `/api/posts` | - | `?page&limit&q` | 200 `{items, page, limit, total}` | - |
| GET | `/api/posts/:id` | - | - | 200 `{post}` | 400, 404 |
| POST | `/api/posts` | ✔ | `{title, content}` | 201 `{post}` | 400, 401 |
| PATCH | `/api/posts/:id` | ✔ 본인 | `{title?, content?}` | 200 `{post}` | 400, 401, 403, 404 |
| DELETE | `/api/posts/:id` | ✔ 본인 | - | 200 `{deletedId}` | 401, 403, 404 |

- 목록 응답에는 `content`를 포함하지 않는다 (`.select('-content')`)
- `page` 최소 1, `limit` 최대 50으로 제한
- `author`는 `{_id, id, name}`으로 populate

### 댓글

| 메서드 | 경로 | 인증 | 요청 | 성공 | 실패 |
|---|---|---|---|---|---|
| GET | `/api/posts/:id/comments` | - | `?page&limit` | 200 `{items, page, limit, total}` | 404 |
| POST | `/api/posts/:id/comments` | ✔ | `{content}` | 201 `{comment}` | 400, 401, 404 |
| PATCH | `/api/comments/:id` | ✔ 본인 | `{content}` | 200 `{comment}` | 400, 401, 403, 404 |
| DELETE | `/api/comments/:id` | ✔ 본인 | - | 200 `{deletedId}` | 401, 403, 404 |

생성·목록은 대상 게시글이 필요하므로 중첩 경로를 쓰고, 수정·삭제는 댓글 `_id`만으로 특정되므로 평면 경로를 사용한다.

## 에러 코드

| 코드 | 상태 | 설명 |
|---|---|---|
| VALIDATION | 400 | 필수값 누락, 길이 초과 |
| INVALID_ID | 400 | ObjectId 형식이 아님 |
| INVALID_LOGIN | 401 | 아이디 또는 비밀번호 불일치 |
| NO_TOKEN | 401 | Authorization 헤더 없음 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| INVALID_TOKEN | 401 | 위조 또는 변조된 토큰 |
| FORBIDDEN | 403 | 타인의 리소스에 대한 수정·삭제 |
| NOT_FOUND | 404 | 존재하지 않는 리소스 |
| DUPLICATE | 409 | 아이디 중복 |
| SERVER_ERROR | 500 | 서버 내부 오류 |

에러는 라우터에서 개별 처리하지 않고 `middlewares/error.js`에서 일괄 변환한다. Express 5가 async 라우터의 예외를 자동으로 에러 핸들러에 전달하므로 `try/catch`를 사용하지 않는다.

## 보안 관련 처리

- 비밀번호는 `pre('save')` 훅에서 bcrypt 해싱 후 저장하며, 스키마에 `select: false`를 지정해 기본 조회에서 제외된다
- JWT payload에는 `{sub, id, grade}`만 담는다. payload는 암호화가 아닌 Base64 인코딩이므로 민감정보를 포함하지 않는다
- 로그인 실패 시 아이디 없음과 비밀번호 불일치를 구분하지 않는다 (계정 열거 방지)
- 수정·삭제는 로그인 여부와 별개로 소유자 일치를 검증한다
- CORS는 `CORS_ORIGIN`에 지정된 출처만 허용한다

## 설계 판단

### 댓글을 별도 컬렉션으로 분리

MongoDB에서는 게시글 문서에 댓글을 배열로 임베딩할 수 있으나, 다음 이유로 분리했다.

- 댓글이 독립적으로 페이지네이션·수정·삭제되어야 함
- 문서 크기 상한(16MB) 제약
- 댓글 하나를 수정하기 위해 게시글 문서 전체를 읽고 써야 하는 비용

**트레이드오프:** 게시글 상세 화면에서 조회가 두 번 발생한다.

### commentCount 비정규화

목록에서 각 게시글의 댓글 수를 표시하기 위해 Post 문서에 `commentCount`를 저장한다. 매 조회마다 `countDocuments`를 반복하거나 aggregate를 사용하는 비용을 피하기 위함이다.

**트레이드오프:** 댓글 생성·삭제 시 `$inc` 갱신이 누락되면 값이 어긋난다. 트랜잭션 없이 두 컬렉션을 갱신하므로 정합성이 보장되지 않는다.

## 테스트

`test.http` (JetBrains HTTP Client)로 전체 시나리오를 검증한다.

1. 회원가입 → 201
2. 동일 아이디 재가입 → 409
3. 잘못된 비밀번호 로그인 → 401
4. 정상 로그인 → 200, 토큰 발급
5. 토큰 없이 글쓰기 → 401
6. 토큰으로 글쓰기 → 201
7. 목록 조회 → `content` 필드 미포함 확인
8. 타 계정으로 삭제 시도 → 403
9. 본인 글 수정 → 200
10. 댓글 작성 후 `commentCount` 증가 확인
11. 존재하지 않는 id 조회 → 404
12. DB에서 비밀번호 해시 저장 확인