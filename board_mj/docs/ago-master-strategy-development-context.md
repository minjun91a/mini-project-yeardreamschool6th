# ago. Master Strategy & Development Context

작성일: 2026-09-08  
문서 목적: Cursor 등 AI 에디터에 전달할 수 있는 ago. 프로젝트의 최상위 제품 전략, 개발 기준, 데이터/엔진/UX 컨텍스트 문서

---

## 0. 이 문서를 AI 에디터에 전달할 때의 사용법

이 문서는 ago. 개발의 기준 문서다. AI 에디터는 이 문서를 프로젝트의 상위 컨텍스트로 먼저 읽고, 이후 코드를 수정할 때 아래 원칙을 따라야 한다.

1. 기능을 추가하기 전에 반드시 이 질문을 먼저 한다.

```text
이 기능은 사용자가 사람을 보러 오게 만드는가,
아니면 장소의 지금을 더 정확하게 만드는가?
```

2. 사람 중심 SNS 기능은 기본적으로 제외하거나 장소 중심 기능으로 재해석한다.

3. 기존 구현은 무조건 삭제하지 않는다. 현재 코드는 다음 아키텍처로 마이그레이션할 기반이다.

4. AI는 제품의 주인공이 아니다. AI는 Location Intelligence의 설명 계층이다.

5. 최신 정보가 없으면 추측하지 않는다. ago.의 기본값은 `unknown`이다.

6. `PlaceStatus`는 단일 게시글이 아니라 여러 Evidence를 종합해 계산한 장소의 현재 상태다.

7. 개발은 이 문서의 `Step 8 Development Roadmap Reset` 순서대로 진행한다.

---

## 1. 확신도 라벨

이 문서의 사실/판단은 다음 라벨을 기준으로 해석한다.

| 라벨 | 의미 |
|---|---|
| 🟢 직접 검증됨 | 이전 전략 대화 또는 웹/공식 문서로 확인된 내용 |
| 🟡 부분검증/추정 | 제품 전략상 확정했지만 실제 코드/상표/정책 검증은 추가 필요 |
| 🔴 미검증 | 구현 전 반드시 별도 검증 필요 |

주요 기준:

- 🟢 ago.의 제품 방향은 `Location First + Real-time + Local Network + AI Intelligence`.
- 🟢 핵심 브랜드 후보는 `ago.` 유지. `now.`는 제품 적합성은 높지만 이름 충돌/상표 리스크가 커서 제외 또는 보류.
- 🟢 Kakao Local API는 장소 검색, 카테고리 검색, 주소/좌표 변환 등 외부 장소 인프라로 활용 가능하다.
- 🟢 Kakao Map API가 카카오 사용자 전체의 GPS 분포 데이터를 ago.에 제공하는 것은 아니다.
- 🟡 `ago.` 상표 사용 가능성은 KIPRIS 및 유사 상표/지정상품 조사가 별도로 필요하다.
- 🟡 엔진 가중치, threshold, half-life 값은 MVP 초기값으로 시작하고 실제 데이터로 튜닝해야 한다.

---

## 2. Brand

## ago.

### 가고 싶은 곳의 지금.

내부 철학:

> 가장 가까운 과거가 가장 정확한 지금을 알려준다.

최종 제품 정의:

> ago.는 사람, 현장, 매장의 다양한 신호를 모아 장소의 현재 상태를 만들어주는 Location Intelligence Network다.

사용자에게 전달되는 가장 단순한 약속:

```text
ago.
가고 싶은 곳의 지금.
```

내부 구조로 해석하면:

```text
3 min ago
5 min ago
8 min ago
Presence
Confirmation
Official Signal
       ↓
장소의 지금
```

`ago.`는 단순히 과거 정보를 보는 앱이 아니다. 누군가가 조금 전에 남긴 현장 정보, 지금 현장에 있는 사용자의 신호, 다른 사용자의 확인, 매장 공식 정보, 외부 장소 데이터가 결합되어 현재 상태를 만든다.

### 브랜드 언어

핵심 단어는 `지금`이다.

- 안양의 지금
- 성수의 지금
- 내 주변의 지금
- 지금 갈 만한 곳
- 지금 변하고 있어요
- 지금 알리기
- 지금도 맞아요
- 여기 지금 어때?
- 지금 가도 될까?

앱 안의 기능명은 가능한 한 이 언어 체계 안에서 정리한다.

### `ago.`와 `now.` 브랜드 판단

전략 검토 중 `now.`도 강한 후보로 검토했다. 제품의 결과물이 `장소의 지금`이기 때문에 `now.`는 직관성이 높다.

하지만 최종 문서 기준에서는 `ago.`를 유지한다.

| 항목 | ago. | now. |
|---|---|---|
| 의미 | 얼마 전 현장 기록이 지금을 만든다 | 현재 상태를 직접 말한다 |
| 제품 철학 | 강함 | 매우 직접적 |
| 고유성 | 상대적으로 유리 | 일반 단어라 충돌 가능성 큼 |
| 슬로건 연결 | 설명적이지만 좋음 | 즉시 이해됨 |
| 상표/검색 리스크 | 별도 검증 필요 | 더 큰 검증 필요 |

정리:

```text
ago.
✅ 최종 브랜드 후보 유지
✅ 제품 철학과 잘 맞음
✅ 시장 충돌 1차 검토상 유지 가치 있음
⚠️ KIPRIS 상표 선행조사 필요

now.
✅ 제품 의미는 매우 직관적
⚠️ 이름 고유성/검색성/상표 리스크 큼
❌ 현재 최종 브랜드명으로는 보류
```

---

## 3. 경쟁 검증과 포지셔닝

### 3.1 1차 경쟁 검증 결과

ago.와 가까운 영역에는 다음 유형의 서비스가 있다.

| 유형 | 대표 예 | 강점 | ago.의 차별점 |
|---|---|---|---|
| 지도/장소 플랫폼 | Google Maps, Kakao Map, Naver Map | 장소 검색, 지도, 리뷰, 영업정보 | 현재 상태를 커뮤니티/Presence/Confirmation 기반으로 계산 |
| 실시간 혼잡 정보 | Google Maps Popular Times/Busy Area | 대규모 위치 데이터 기반 혼잡 표시 | ago 자체 현장 Signal과 장소별 Evidence 구조 |
| 실시간 장소 커뮤니티 | NOWN | 사용자가 현재 장소 정보를 사진/댓글/혼잡도 등으로 공유 | 사람 중심 반응/게시물 유지가 아니라 PlaceStatus Core Engine 중심 |
| 지역 정보 앱 | 서울나우 등 | 특정 지역 추천/혼잡/AI 추천 | ago는 특정 도시 가이드보다 장소 상태 네트워크에 집중 |
| SNS/커뮤니티 | Instagram, Threads, X, 지역 커뮤니티 | 사람/콘텐츠 중심 확산 | 좋아요/팔로워 중심을 제거하고 Location Graph로 전환 |

### 3.2 NOWN과의 차이

NOWN은 실시간 위치 기반 장소 정보, 사진, 한줄 코멘트, 평점, 혼잡도, 주차 정보, 사라지는 NOW 피드, 장소 Q&A, 팔로우/좋아요/댓글/공유 등을 제공하는 것으로 확인된다. 따라서 ago.와 직접 비교해야 하는 가장 가까운 국내 경쟁 후보 중 하나다.

ago.가 NOWN과 달라져야 하는 지점:

| 항목 | NOWN 계열 접근 | ago. 확정 방향 |
|---|---|---|
| 중심 객체 | 실시간 게시물/사진/사용자 활동 | Place와 PlaceStatus |
| 사회적 반응 | 좋아요, 댓글, 팔로우, 공유 | 지금도 맞아요, 달라졌어요, Field Conversation |
| 피드 유지 | 참여 반응이 많으면 더 오래 노출 | Freshness/Trust 기반으로 정보 유효성 계산 |
| 프로필 | 기록, 팔로워/팔로잉, 성장/타이틀 | 장소 기여 기록, 관심 장소, 현장 확인 |
| 알림 | 댓글/좋아요/팔로우 등 반응 알림 | 장소 상태 변화 알림 |
| AI | 추천/요약 가능 | Core Engine 이후의 해석 계층 |
| 데이터 자산 | 장소 게시물/사용자 기록 | Evidence → PlaceStatus → 상태 변화 이력 |

ago.는 `실시간 장소 게시판`이 아니라 `장소의 현재 상태를 계산하는 네트워크`가 되어야 한다.

### 3.3 Google Maps와의 차이

Google Maps는 인기 시간대, 대기 시간, 방문 지속 시간, 지역 혼잡도 등을 보여준다. Google은 충분한 데이터가 있을 때 집계/익명화된 데이터를 바탕으로 혼잡 정보를 표시하며, 정보가 충분하지 않으면 표시하지 않는다.

ago.가 배워야 할 점:

- 개인 위치를 직접 노출하지 않는다.
- 충분한 데이터가 없으면 표시하지 않는다.
- 단순 절대 인원 수보다 장소/지역의 평소 상태 대비 변화를 본다.
- 개인 위치를 빠르게 집계 데이터로 변환한다.

ago.의 차별점:

- Google은 거대한 플랫폼의 위치 데이터 기반이다.
- ago.는 사용자의 직접 현장 기록, QuickSignal, Confirmation, Presence, OfficialUpdate를 결합한다.
- ago.는 장소별 현장 대화와 매장 공식 정보까지 포함한 실시간 장소 정보 네트워크를 만든다.

### 3.4 Kakao Map/Kakao Local의 역할

Kakao는 ago.의 경쟁자라기보다 초기 한국 로컬 장소 인프라로 활용할 가능성이 높다.

Kakao의 역할:

```text
Kakao
├─ 장소 검색
├─ 카테고리 검색
├─ 주소 → 좌표
├─ 좌표 → 주소/행정동
└─ 지도 표시 후보
```

ago.의 역할:

```text
ago.
├─ PlaceStatus
├─ 현장 기록
├─ 현장 인증
├─ QuickSignal
├─ Confirmation
├─ Presence Signal
├─ 상태 변화
├─ AI 해석
├─ 매장 공식 정보
└─ 장소 팔로우/알림
```

중요한 원칙:

```text
Kakao place = 외부 장소 원본/검색 인프라
ago Place = ago 내부의 장소 객체
```

Kakao 장소 ID를 ago의 주키로 삼지 않는다. ago는 자체 `Place._id`를 유지하고, 외부 ID는 `externalSources`에 연결한다.

### 3.5 포지셔닝 문장

ago.는 리뷰 앱이 아니다.  
ago.는 맛집 추천 앱도 아니다.  
ago.는 사람을 팔로우하는 SNS도 아니다.  
ago.는 AI 챗봇 앱도 아니다.

ago.는:

> 장소의 지금을 팔로우하고, 확인하고, 업데이트하는 Location Intelligence Network다.

---

## 4. Step 1 Product Identity

### 4.1 핵심 정체성

ago.는 사람을 중심으로 관계와 인기를 쌓는 SNS가 아니라, 장소의 현재 상태와 변화가 사람들의 현장 기록을 통해 축적되는 Location First 커뮤니티다.

한 문장으로:

> ago.는 사람을 팔로우하는 커뮤니티가 아니라, 장소의 지금을 팔로우하는 커뮤니티다.

### 4.2 핵심 질문

ago.가 답해야 하는 사용자 질문은 세 단계다.

1. 특정 장소

```text
여기 지금 어때?
```

2. 방문 의사결정

```text
지금 가도 될까?
```

3. 동네/지역 탐색

```text
그럼 지금 어디가 괜찮아?
```

장기적으로 네 번째 질문이 추가된다.

```text
이 동네의 가게/장소 상태를 한 시스템에서 볼 수 있을까?
```

### 4.3 유지/수정/삭제의 기준

| 현재 기능 | 판정 | 이유 |
|---|---|---|
| Place | 유지/강화 | 서비스의 최상위 객체 |
| NOW | 수정/강화 | 사람의 최신 글이 아니라 장소의 최신 변화 |
| 지도 | 유지/강화 | 장소 탐색 핵심 인터페이스 |
| 장소 상세 | 유지/강화 | ago.의 가장 중요한 화면 |
| 여유/보통/혼잡 | 유지/강화 | 장소 현재 상태의 기본 표현 |
| 현장 인증 | 유지/강화 | Trust Engine의 핵심 Evidence |
| 최근 현장 기록 | 유지/대폭 강화 | 장소 시간축의 원천 데이터 |
| 장소 팔로우 | 유지/강화 | Location Graph의 핵심 |
| 장소 알림 | 유지/강화 | PlaceStatus 변화 전달 |
| 글쓰기 | 수정 | 게시글 작성 → 지금 알리기 |
| 댓글 | 수정 | 일반 댓글 → Field Conversation |
| 사용자 프로필 | 수정 | 인기 프로필 → 기여/관심 장소 |
| 사용자 팔로우 | 삭제 | 사람 중심 관계망을 만듦 |
| 팔로워/팔로잉 수 | 삭제 | 인기 경쟁을 유발 |
| 좋아요 | 도입하지 않음 | 일반 SNS 문법으로 흐름이 바뀜 |
| 조회수 | 약화/숨김 | 장소 정보 가치와 직접 관련 낮음 |

### 4.4 새롭게 강화할 개념

| 개념 | 역할 |
|---|---|
| 지금도 맞아요 | 기존 현장 정보가 아직 유효함을 확인 |
| 달라졌어요 | 장소 상태 변화 가능성 신호 |
| 상태 신선도 | 정보가 아직 현재를 설명하는 정도 |
| 상태 신뢰도 | 정보 출처/현장 인증/합의 수준 |
| 현재 상태 | 여러 Evidence로 계산한 PlaceStatus |
| 장소 타임라인 | 장소가 시간에 따라 어떻게 변했는지 |
| 현장 참여 | 실제 근처 사용자의 참여 신호 |
| Presence Signal | 동의 기반 위치 신호를 장소 단위로 변환 |

### 4.5 사람의 역할

User는 사라지지 않는다. 다만 중심이 아니다.

User의 역할:

- 현장 정보를 제공한 사람
- 여러 장소의 지금을 확인한 사람
- 신뢰할 수 있는 최근 기록을 남긴 사람
- 장소 상태 정확도에 기여한 사람

User가 되면 안 되는 것:

- 유명한 사람
- 팔로워가 많은 사람
- 좋아요를 많이 받은 사람
- 피드의 주인공

---

## 5. Step 2 Information Architecture

### 5.1 전체 IA

하단 Navigation은 다음 5개로 확정한다.

```text
지금 | 장소 | 지금 알리기 | 알림 | 마이
```

별도 AI 탭은 만들지 않는다.

전체 구조:

```text
ago.
│
├── 지금
│    └── 지역/동네의 현재 상황판
│
├── 장소
│    ├── 검색
│    ├── 지도
│    └── 현실 세계 장소 탐색
│
├── 지금 알리기
│    └── 장소의 현재 상태 Signal 입력
│
├── 알림
│    └── 관심 장소 변화
│
└── 마이
     ├── 관심 장소
     ├── 내 현장 기록
     └── 내 기여

        ↓

   [장소 상세]
     ├── 현재 상태
     ├── Freshness/Confidence
     ├── 상태 변화
     ├── Confirmation
     ├── 현장 Evidence
     ├── Field Conversation
     ├── OfficialUpdate
     └── AI Summary/Visit Guidance
```

### 5.2 각 탭의 역할

| 탭 | 사용자의 질문 | 화면 역할 |
|---|---|---|
| 지금 | 지금 이 동네에서 무슨 일이 일어나지? | 지역의 현재 상황판 |
| 장소 | 내가 가려는 곳은 지금 어떻지? | 현실 장소 검색/지도 탐색 |
| 지금 알리기 | 내가 보고 있는 상태를 알려줄까? | 1초 Signal 입력 |
| 알림 | 관심 장소에 무엇이 바뀌었지? | 장소 변화 알림 |
| 마이 | 나는 어떤 장소에 기여했지? | 장소 활동 기록/관심 장소 |
| 장소 상세 | 그래서 지금 가도 될까? | 방문 판단의 핵심 화면 |

### 5.3 `지금`과 `장소`의 차이

```text
지금 = 상황 발견
장소 = 장소 탐색
```

`지금`은 최근 의미 있는 Signal이 있는 장소를 중심으로 보여준다.  
`장소`는 ago 데이터가 없는 현실 장소도 검색 가능해야 한다.

### 5.4 현장 모드와 탐색 모드

ago.는 위치 기반 앱이지만 현재 위치를 강제하면 안 된다.

현장 모드:

```text
나는 지금 여기 있다
→ Presence
→ QuickSignal
→ Confirmation
→ 지금 알리기
```

탐색 모드:

```text
나는 아직 다른 곳에 있다
→ 약속 장소 검색
→ 장소의 지금 확인
→ 방문 판단
```

현재 위치와 보고 있는 지역은 구분한다.

```text
현재 위치: 안양
보고 있는 지역: 성수
```

---

## 6. Step 3 Data Model

### 6.1 핵심 방향

기존 구조가:

```text
User → Post → Place
```

였다면, 앞으로는:

```text
Neighborhood
     ↓
Place
     ├── PlaceUpdate
     ├── QuickSignal
     ├── Confirmation
     ├── PresenceSignal
     ├── OfficialUpdate
     ├── PlaceStatus
     ├── PlaceFollow
     └── FieldConversation
```

가 되어야 한다.

모든 핵심 데이터는 Place를 중심으로 모인다.

### 6.2 확정 모델 목록

| 모델 | 역할 | 결정 |
|---|---|---|
| `Neighborhood` | 행정동 단위 지역 | 신규 |
| `Place` | ago.의 중심 장소 Entity | 강화 |
| `PlaceUpdate` | 사용자의 현장 관측 정보 | Post와 분리 |
| `QuickSignal` | 1-tap 상태 공유 | 신규 |
| `PresenceSignal` | 위치 동의 기반 장소 단위 활동 Signal | 신규 |
| `PlaceStatus` | 계산된 장소 상태 이력 | 신규 |
| `Place.currentStatus` | 빠른 조회용 최신 snapshot | 신규 |
| `Confirmation` | 지금도 맞아요/달라졌어요 | 독립 모델 |
| `PlaceFollow` | User ↔ Place 관심 관계 | 독립 모델 |
| `OfficialUpdate` | 매장 공식 실시간 정보 | 신규 |
| `BusinessAccount` | 매장/사업자 계정 | User와 분리 |
| `User` | 현장 기여자 | 역할 변경 |
| `Comment`/`FieldConversation` | 현장 정보 보완 대화 | 유지/수정 |
| `Post` | 일반 SNS 콘텐츠 | 핵심 모델에서 제외 |
| `Notification` | 장소 변화 전달 | 장소 중심으로 수정 |
| `AIInterpretation` | 상태/지역 요약과 방문 판단 보조 | 신규 |

### 6.3 Neighborhood

내부 DB 기준은 행정동으로 시작한다.

```ts
type Neighborhood = {
  _id: ObjectId;
  name: string;              // 성수1가1동
  displayName: string;       // 성수
  city: string;              // 서울특별시
  district: string;          // 성동구
  regionCode?: string;       // Kakao coord2regioncode 등 외부 코드
  center: {
    lat: number;
    lng: number;
  };
  boundary?: GeoJSONPolygon;
  createdAt: Date;
  updatedAt: Date;
};
```

UI에서는 `성수1가1동` 같은 행정명을 그대로 노출하지 않아도 된다. 사용자에게는 `성수`, `안양역`, `홍대`, `판교`처럼 친숙한 표현을 사용할 수 있다.

### 6.4 Place

ago.는 자체 Place ID를 유지한다.

```ts
type Place = {
  _id: ObjectId;

  name: string;
  normalizedName?: string;
  category: PlaceCategory;

  address?: string;
  roadAddress?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };

  neighborhood?: ObjectId;

  externalSources: Array<{
    provider: "kakao" | "naver" | "google" | "public_data" | "merchant";
    externalPlaceId: string;
    url?: string;
    rawCategory?: string;
    lastSyncedAt?: Date;
  }>;

  currentStatus: PlaceCurrentStatus;

  stats?: {
    updateCount: number;
    confirmationCount: number;
    followerCount: number;
    lastSignalAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
};

type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "bar"
  | "popup"
  | "shopping"
  | "park"
  | "culture"
  | "street"
  | "other";
```

### 6.5 PlaceUpdate

기존 `Post(kind='now')`를 대체한다.

```ts
type PlaceUpdate = {
  _id: ObjectId;

  place: ObjectId;
  author: ObjectId;

  status: "quiet" | "normal" | "busy" | "unknown";

  originalText?: string;
  content?: string;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
    blurHash?: string;
  }>;

  signals: StructuredSignal[];

  visitVerified: boolean;
  distanceFromPlace?: number;

  source: "community";

  observedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

원칙:

- `observedAt`과 `createdAt`을 구분한다.
- 사용자 원문은 절대 버리지 않는다.
- AI 추출값은 직접 입력값과 구분한다.
- 사진/내용은 선택 사항이다.
- 장소 + 상태만으로도 제출 가능해야 한다.

### 6.6 StructuredSignal

```ts
type StructuredSignal = {
  type:
    | "crowd"
    | "waitingTeams"
    | "waitingMinutes"
    | "seatAvailability"
    | "parkingAvailability"
    | "noiseLevel"
    | "stockAvailability"
    | "entryLine"
    | "traffic";

  value: string | number | boolean;

  source:
    | "user_input"
    | "ai_extracted"
    | "presence"
    | "official"
    | "external"
    | "system";

  confidence?: number;       // AI 추출 또는 추정값인 경우
  observedAt: Date;
};
```

MVP 초기 Signal:

```text
waitingMinutes
waitingTeams
seatAvailability
parkingAvailability
noiseLevel
```

초기 카테고리는 카페/음식점부터 시작한다.

### 6.7 QuickSignal

1초짜리 현장 Signal이다.

```ts
type QuickSignal = {
  _id: ObjectId;
  place: ObjectId;
  user: ObjectId;

  status: "quiet" | "normal" | "busy";

  visitVerified: boolean;
  distanceFromPlace?: number;

  observedAt: Date;
  createdAt: Date;
};
```

`QuickSignal`은 긴 게시글이 아니다. 사용자가 현장에서:

```text
지금 어떤가요?
[여유] [보통] [혼잡]
```

만 눌러도 생성된다.

### 6.8 Confirmation

좋아요가 아니다. 독립 Evidence다.

```ts
type Confirmation = {
  _id: ObjectId;

  user: ObjectId;
  place: ObjectId;
  placeUpdate?: ObjectId;
  placeStatus?: ObjectId;

  type: "still_valid" | "changed";

  visitVerified: boolean;
  distanceFromPlace?: number;

  observedAt: Date;
  createdAt: Date;
};
```

원칙:

- `지금도 맞아요`는 기존 상태의 유효성을 강화한다.
- `달라졌어요`는 기존 상태가 깨졌다는 신호다.
- `달라졌어요`만으로 새 상태를 확정하지 않는다.
- `user + placeUpdate` 또는 `user + placeStatus` 단위로 중복 방지 index를 둔다.

### 6.9 PresenceSignal

사용자 위치 동의를 장소 단위 Signal로 변환한다.

```ts
type PresenceSignal = {
  _id: ObjectId;

  place: ObjectId;
  neighborhood?: ObjectId;

  bucketStart: Date;
  bucketEnd: Date;

  nearbyPresenceCount: number;
  verifiedPresenceCount: number;
  averageDwellTimeMinutes?: number;
  presenceTrend: "rising" | "stable" | "falling" | "unknown";

  confidence: number;

  source: "presence";
  createdAt: Date;
};
```

개별 사용자의 이동경로를 핵심 데이터로 장기 저장하지 않는다. Raw GPS는 필요한 범위에서 장소 매칭 후 빠르게 장소 단위 aggregate로 변환한다.

### 6.10 PlaceStatus

`PlaceStatus`는 ago.의 핵심 결과 모델이다.

```ts
type PlaceStatus = {
  _id: ObjectId;

  place: ObjectId;

  status: "quiet" | "normal" | "busy" | "unknown";
  candidateStatus?: "quiet" | "normal" | "busy" | "unknown";

  confidenceScore: number;   // 0~1
  freshnessScore: number;    // 0~1

  evidenceCount: number;
  verifiedEvidenceCount: number;

  signalScores: {
    quiet: number;
    normal: number;
    busy: number;
  };

  trend: "rising" | "falling" | "stable" | "unknown";

  freshestEvidenceAt?: Date;
  calculatedAt: Date;
  validUntil?: Date;

  evidenceRefs: Array<{
    type: "PlaceUpdate" | "QuickSignal" | "Confirmation" | "PresenceSignal" | "OfficialUpdate";
    id: ObjectId;
    weight: number;
  }>;

  changeReason?:
    | "new_evidence"
    | "evidence_shift"
    | "confirmation"
    | "changed_signal"
    | "expired"
    | "official_update";

  createdAt: Date;
};
```

`Place.currentStatus`에는 빠른 조회용 snapshot을 둔다.

```ts
type PlaceCurrentStatus = {
  status: "quiet" | "normal" | "busy" | "unknown";
  confidenceScore: number;
  freshnessScore: number;
  trend: "rising" | "falling" | "stable" | "unknown";
  lastSignalAt?: Date;
  freshestEvidenceAt?: Date;
  calculatedAt?: Date;
  placeStatusId?: ObjectId;
};
```

하이브리드 구조:

```text
Place.currentStatus
→ 지도/NOW 빠른 조회

PlaceStatus history
→ 장소 상세/상태 변화/AI/분석
```

### 6.11 OfficialUpdate

매장 공식 정보는 커뮤니티 정보와 분리한다.

```ts
type OfficialUpdate = {
  _id: ObjectId;

  place: ObjectId;
  businessAccount: ObjectId;

  type:
    | "wait_time"
    | "sold_out"
    | "parking"
    | "business_hours"
    | "event"
    | "notice"
    | "crowd"
    | "custom";

  status?: "quiet" | "normal" | "busy" | "unknown";
  message?: string;
  signals: StructuredSignal[];

  validFrom: Date;
  validUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
};
```

### 6.12 PlaceFollow

`User.followedPlaces[]`에서 독립 모델로 분리한다.

```ts
type PlaceFollow = {
  _id: ObjectId;

  user: ObjectId;
  place: ObjectId;

  notificationPreferences: {
    statusChange: boolean;
    becameQuiet: boolean;
    becameBusy: boolean;
    officialUpdate: boolean;
    fieldConversationReply?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
};
```

MVP에서는 `장소 팔로우 = 관심 장소 등록`으로 시작한다. 나중에 저장/팔로우를 분리할 수 있다.

### 6.13 AIInterpretation

```ts
type AIInterpretation = {
  _id: ObjectId;

  place?: ObjectId;
  neighborhood?: ObjectId;

  type:
    | "current_summary"
    | "visit_guidance"
    | "change_explanation"
    | "neighborhood_summary"
    | "signal_extraction";

  sourceStatusId?: ObjectId;
  sourceEvidenceIds?: ObjectId[];

  summary: string;
  visitGuidance?: string;

  reasons: string[];
  confidence: number;

  generatedAt: Date;
  staleAt?: Date;
};
```

상태가 바뀌면 기존 AIInterpretation은 stale 처리한다.

---

## 7. Step 4 Core Engine

Core Engine의 목표:

> 여러 현장 Evidence를 가지고 이 장소의 지금을 계산한다.

전체 구조:

```text
PlaceUpdate
QuickSignal
Confirmation
PresenceSignal
OfficialUpdate
External/Baseline
        ↓
Evidence Layer
        ↓
Freshness Engine
        ↓
Trust Engine
        ↓
Current Status Engine
        ↓
Change Detection Engine
        ↓
PlaceStatus
        ↓
AI Interpretation Layer
        ↓
NOW / Map / Place Detail / Notification
```

### 7.1 Freshness Engine

질문:

```text
이 정보가 아직 현재를 설명한다고 볼 수 있는가?
```

Freshness는 시간 기반이다.

```ts
freshnessScore = 0.5 ** (elapsedMinutes / halfLifeMinutes)
```

초기 half-life 예시:

| Category | halfLife |
|---|---|
| cafe | 30분 |
| restaurant | 20분 |
| popup | 10분 |
| shopping | 30분 |
| park | 45분 |
| street | 20분 |

원칙:

- `freshnessScore`는 0~1 숫자로 저장한다.
- MVP에서는 category 단위 half-life로 시작한다.
- 이후 signal별 half-life로 확장한다.
- 현장 인증은 Freshness가 아니라 Trust에서 처리한다.
- `달라졌어요` 신호는 기존 정보의 effective freshness를 급격히 낮출 수 있다.
- `PlaceStatus.freshnessScore`는 `calculatedAt`이 아니라 evidence freshness 기반으로 계산한다.

예:

```ts
const timeFreshness = 0.5 ** (elapsedMinutes / halfLife);
const effectiveFreshness = timeFreshness * changePenalty;
```

### 7.2 Trust Engine

질문:

```text
이 정보는 얼마나 믿을 만한가?
```

Trust와 Freshness는 분리한다.

```text
Freshness = 얼마나 최근인가
Trust = 얼마나 믿을 수 있는가
```

Trust feature:

| Feature | 의미 |
|---|---|
| Location Verification | 현장 인증 |
| Source Reliability | community/merchant/external |
| Evidence Agreement | 여러 관측의 일치도 |
| Confirmation | 지금도 맞아요/달라졌어요 |
| Contributor Trust | 과거 기여 품질 |
| AI Confidence | AI 추출값의 신뢰도 |

원칙:

- 사람의 인기나 팔로워 수는 신뢰도에 사용하지 않는다.
- 현장 인증 하나만으로 사실이라고 단정하지 않는다.
- AI가 추출한 정보에는 AI confidence를 별도로 둔다.
- 각 신뢰 신호를 원본 feature로 보존하고 최종 `confidenceScore`를 별도로 계산한다.
- 초기 가중치는 테스트용으로 시작하고 실제 DB가 쌓이면 조정한다.

초기 가중치 예시:

```ts
type EvidenceWeightInput = {
  freshnessScore: number;
  visitVerified: boolean;
  source: "community" | "merchant" | "external" | "presence" | "ai_extracted";
  agreementScore: number;
  contributorTrustScore?: number;
  aiConfidence?: number;
};
```

### 7.3 Multi-Signal Architecture

ago.의 PlaceStatus는 하나의 글에서 나오지 않는다.

```text
PlaceUpdate
+ QuickSignal
+ Confirmation
+ PresenceSignal
+ OfficialUpdate
+ External/Baseline
        ↓
PlaceStatus
```

Signal별 성격:

| Signal | 강점 | 주의점 |
|---|---|---|
| PlaceUpdate | 풍부한 현장 정보 | 작성 비용이 높음 |
| QuickSignal | 참여 비용이 낮음 | 정보량이 적음 |
| Confirmation | 기존 정보 수명 연장/변화 감지 | 새 상태 자체는 아님 |
| PresenceSignal | 글 없이도 활동 신호 축적 | 혼잡도 자체가 아님 |
| OfficialUpdate | 매장 공식 정보 | 현장 체감과 충돌 가능 |
| External/Baseline | Cold Start 보조 | 현재 상태로 둔갑하면 안 됨 |

### 7.4 Current Status Engine

질문:

```text
그래서 이 장소는 지금 여유/보통/혼잡/정보없음 중 무엇인가?
```

초기 계산 방식은 deterministic rule 기반으로 시작한다.

개념:

```ts
for each evidence:
  freshness = FreshnessEngine.calculate(evidence)
  trust = TrustEngine.calculate(evidence)
  weight = freshness * trust
  add weight to evidence.status score

status = max(quietScore, normalScore, busyScore)
confidence = computeConfidence(scoreDifference, evidenceAgreement, verifiedRatio)
```

결과:

```ts
{
  status: "busy",
  confidenceScore: 0.87,
  freshnessScore: 0.92,
  evidenceCount: 7,
  verifiedEvidenceCount: 4,
  trend: "rising"
}
```

원칙:

- 최신 글 하나를 현재 상태로 쓰지 않는다.
- 여러 Evidence의 시간, 신뢰도, 일치도, 출처를 종합한다.
- Evidence가 충분하지 않으면 `unknown`.
- `Presence 많음 = busy`가 아니다. Presence는 활동 증가 Signal이다.
- 매장 공식 정보와 사용자 현장 정보가 충돌하면 출처를 숨기지 않는다.

### 7.5 Presence Signal

정식 위치 권한 카피:

```text
내 주변의 지금을 확인하려면
위치 권한이 필요해요.
```

흐름:

```text
ago 실행
   ↓
"내 주변의 지금을 확인하려면
 위치 권한이 필요해요."
   ↓
사용자 동의
   ↓
현재 위치 확인
   ↓
주변 Kakao Place와 매칭
   ↓
장소 단위 Presence Signal 생성
   ↓
Core Engine
```

핵심 원칙:

> ago.는 개인의 이동경로를 만드는 서비스가 아니라, 동의를 받아 필요한 위치 신호를 장소 단위 Presence로 변환하여 장소의 현재 상태를 이해하는 서비스다.

금지:

```text
Presence 많음
→ 🔴 혼잡
```

허용:

```text
Presence 증가
+ QuickSignal busy
+ 현장 인증 PlaceUpdate busy
→ busy 가능성 상승
```

지도/홈 UI에서:

```text
현재 17명이 여기 있습니다
```

처럼 노출하지 않는다.

대신:

```text
최근 현장 활동 증가 중
현장 확인 활발
```

처럼 표현한다.

### 7.6 Change Detection Engine

질문:

```text
상태가 정말 바뀌었는가?
```

`Current Status Engine`과 `Change Detection Engine`을 분리한다.

```text
Multi-Signal
     ↓
Current Status Engine
     ↓
Candidate Status
     ↓
Change Detection Engine
     ↓
Confirmed PlaceStatus
```

판단 기준:

1. Score Difference
2. Confidence
3. Persistence

고정된 N분 대기 방식은 사용하지 않는다.

```text
약한 Evidence → 더 오래 관찰
강한 Evidence → 빠른 상태 변경 허용
```

`달라졌어요`의 역할:

```text
기존 상태가 깨졌다는 신호
```

`달라졌어요`만으로:

```text
busy → quiet
```

을 확정하지 않는다.

상태 변화와 정보 만료는 다르다.

```text
State Change
normal → busy
실제 변화 Evidence 존재

Expiration
busy → unknown
최근 Evidence 부족
```

중요 원칙:

> 새로운 정보가 없다는 것은 상태가 좋아졌다는 뜻이 아니다.

### 7.7 Notification Threshold 분리

상태 변화 기준과 알림 기준은 다르다.

```text
Status Change Threshold
≠
Notification Threshold
```

알림 기준이 더 높아야 한다.

예:

```text
normal → busy
confidence 0.54
→ 내부 상태 반영 가능, 푸시 보류

normal → busy
confidence 0.91
verified evidence 4
quick signals 3
changed signals 2
→ 알림 가능
```

### 7.8 AI Interpretation Layer

핵심 원칙:

```text
AI → 상태 생성 ❌
Core Engine → 상태 계산
AI → 상태 해석 ⭕
```

AI의 역할:

1. 현재 상황 요약
2. 방문 판단 보조
3. 사용자 자연어 구조화
4. 상태 변화 설명
5. 동네 전체 요약

예:

```text
Core Engine:
status: busy
confidence: 0.88
freshness: 0.93
waitingTeams: 9
seatAvailability: low

AI:
지금은 붐비는 편이에요.
최근 현장 기록에서 대기와 좌석 부족이 함께 확인되고 있어요.
```

AI 금지:

- 데이터가 없는데 상태 만들기
- 예측을 현재 상태처럼 보여주기
- AI 추출값을 사용자 원본보다 우선하기
- 공식정보와 커뮤니티 정보를 섞어서 출처 숨기기
- 모든 요청마다 LLM을 호출하기

AI 결과도 만료되어야 한다.

```text
PlaceStatus 변경
↓
기존 AIInterpretation stale
↓
새 요약 생성
```

### 7.9 Cold Start

Cold Start는 세 종류로 나눈다.

| 유형 | 의미 | 대응 |
|---|---|---|
| Service Cold Start | 사용자/Signal 자체가 부족 | 특정 지역 Signal Density 확보 |
| Place Cold Start | 장소는 있으나 Evidence 없음 | `unknown`, QuickSignal 유도 |
| Time Cold Start | 과거 정보는 있으나 현재 정보 없음 | 과거 패턴은 참고로만 표시 |

원칙:

- 현재 Evidence가 없으면 반드시 `unknown`.
- 과거 패턴/외부정보는 현재 상태가 아니라 참고 정보다.
- Presence Signal은 Cold Start 해결의 핵심 자체 데이터 확보 수단이다.
- 긴 글보다 1초짜리 현장 참여를 우선 설계한다.
- 초기에 전국보다 특정 지역의 Signal Density를 확보한다.
- AI는 Cold Start의 빈 데이터를 만들어내지 않는다.

Data Flywheel:

```text
사용자 증가
    ↓
Presence 증가
    ↓
QuickSignal 증가
    ↓
PlaceUpdate / Confirmation 증가
    ↓
PlaceStatus 정확도 증가
    ↓
ago 방문 판단 가치 증가
    ↓
사용자 증가
    ↺
```

### 7.10 Core Engine Output

Core Engine은 최소한 다음 결과를 저장/반환해야 한다.

```ts
type CoreEngineOutput = {
  placeId: string;

  status: "quiet" | "normal" | "busy" | "unknown";
  candidateStatus?: "quiet" | "normal" | "busy" | "unknown";

  freshnessScore: number;
  confidenceScore: number;

  evidenceCount: number;
  verifiedEvidenceCount: number;
  freshestEvidenceAt?: Date;

  trend: "rising" | "falling" | "stable" | "unknown";

  signalScores: {
    quiet: number;
    normal: number;
    busy: number;
  };

  shouldCreateStatusChange: boolean;
  shouldNotifyFollowers: boolean;

  reasons: string[];
};
```

프론트는 이 값을 기반으로 다음 UI를 만든다.

```text
🔴 혼잡
4분 전 · 현장 정보 충분
최근 혼잡 증가 중
```

---

## 8. Step 5 Social System

### 8.1 핵심 방향

ago.는 Social Graph가 아니라 Location Graph다.

일반 SNS:

```text
사람 → 사람
  ↓
팔로우
좋아요
인기
콘텐츠
```

ago.:

```text
사람 → 장소 ← 사람
       ↓
   현장 정보
       ↓
   장소의 지금
```

### 8.2 삭제/제외

| 기능 | 결정 | 이유 |
|---|---|---|
| User Follow | 삭제 | 사람 중심 피드로 회귀 |
| Follower Count | 삭제 | 인기 지표 |
| Following Count | 삭제 | 사람 관계망 유도 |
| Like | 도입하지 않음 | 게시물 인기 경쟁 |
| 인기 랭킹 | 도입하지 않음 | 경쟁형 SNS 요소 |

### 8.3 유지/강화

| 기능 | 방향 |
|---|---|
| PlaceFollow | 관심 장소/상태 변화 알림의 중심 |
| Confirmation | 정보 유효성/변화 감지 |
| Field Conversation | 장소 현재 정보 보완 대화 |
| Contributor Profile | 현장 기여 기록 |
| Notification | 장소 변화 중심 |

### 8.4 참여 단계

사용자 참여 비용을 낮춘다.

```text
Presence
   ↓
QuickSignal
   ↓
Confirmation
   ↓
짧은 PlaceUpdate
   ↓
사진 + 상세 PlaceUpdate
```

항상 긴 글을 요구하지 않는다.

---

## 9. Step 6 UI/UX

## 9.1 6-1 Navigation / App Shell

확정:

```text
지금 | 장소 | 지금 알리기 | 알림 | 마이
```

원칙:

1. `지금 알리기`를 중앙 Primary Action으로 둔다.
2. `글쓰기`라는 표현은 제거한다.
3. 현재 위치와 탐색 중인 지역을 구분한다.
4. 위치 권한이 없어도 장소 검색/탐색은 가능하다.
5. 위치 권한을 허용하면 Presence/현장 기능이 강화된다.
6. 현장 모드와 사전 탐색 모드를 모두 지원한다.
7. 별도 AI 탭을 만들지 않는다.

권한 없음 화면:

```text
ago.

내 주변의 지금을 확인하려면
위치 권한이 필요해요.

[위치 허용]

다른 지역 찾아보기
```

## 9.2 6-2 `지금`

`지금`은 게시물 피드가 아니라 지역의 현재 상황판이다.

구조:

```text
ago.

안양 ▾

안양의 지금

주요 음식점의 혼잡이
조금씩 줄고 있어요.

최근 현장 정보 48개
상태 확인 장소 31곳

[전체] [카페] [음식점] [팝업]

지금 갈 만한 곳
OO카페  🟢 여유 · 4분 전
OO식당  🟡 보통 · 7분 전

지금 변하고 있어요
OO카페  🟡 → 🔴 · 8분 전
OO공원  🔴 → 🟡 · 12분 전

내 관심 장소

최근 현장 기록
```

원칙:

- 사람 글보다 장소 상태가 먼저다.
- 최근 의미 있는 Signal이 있는 장소를 우선 노출한다.
- unknown 장소는 홈에 과도하게 나열하지 않는다.
- AI는 `ago 요약` 정도로 자연스럽게 사용한다.
- Presence 숫자를 직접 보여주지 않는다.

## 9.3 6-3 장소 탐색 / 지도

역할:

> 서울/경기의 실제 장소를 찾고, 그 장소의 지금을 비교한다.

구조:

```text
장소
 ├─ 검색: 특정 장소를 알고 있음
 └─ 지도: 주변에서 장소를 발견하고 싶음
```

장소 검색은 ago DB만 대상으로 하면 안 된다.

```text
사용자 검색
  ↓
External Place Provider
  ↓
현실 장소 검색 결과
  ↓
ago Place 연결
  ↓
PlaceStatus 결합
```

지도 마커:

```text
🟢 여유
🟡 보통
🔴 혼잡
· 정보 없음
```

원칙:

- Live Status가 있는 장소를 시각적으로 강조한다.
- unknown 장소는 낮은 강조도로 보여준다.
- 지도 viewport 기준으로 장소를 탐색한다.
- `이 지역에서 검색` 패턴을 사용한다.
- 카테고리 + 현재 상태 필터를 제공한다.
- 선택한 장소는 Bottom Sheet에서 현재 상태/Freshness를 우선 표시한다.
- 지도 SDK와 ago 데이터 구조를 분리한다.

## 9.4 6-4 장소 상세

ago.에서 가장 중요한 화면이다.

역할:

```text
그래서 지금 이 장소에 가도 되는가?
```

권장 구조:

```text
OO카페
카페 · 성수 · 320m

지금
🔴 혼잡

4분 전 · 현장 정보 충분
최근 혼잡 증가 중

ago 요약
현재는 여유로운 방문이 어려울 가능성이 높아요.
최근 현장 기록에서 대기와 좌석 부족이 함께 확인되고 있어요.

[지금도 맞아요] [달라졌어요]

상태 변화
13:21 🟢 여유
13:48 🟡 보통
14:10 🔴 혼잡

현장 Evidence
- 🔴 혼잡 · 현장 인증 · 4분 전
- 웨이팅 8팀 · 6분 전
- 좌석 거의 없음 · 7분 전

매장 공식 정보
현재 대기 약 20분

현장 대화
Q. 지금 자리 있나요?
A. 거의 없어요.

[지금 알리기]
```

원칙:

- 장소 이름과 현재 상태가 첫 화면의 주인공이다.
- 작성자보다 Evidence와 상태가 먼저다.
- Freshness와 Confidence를 사용자가 이해할 수 있는 말로 표현한다.
- `unknown`이면 솔직히 정보 부족을 보여주고 Signal 입력을 유도한다.
- OfficialUpdate와 Community Evidence는 출처를 구분한다.
- AI Summary는 근거 기반이어야 한다.

## 9.5 6-5 지금 알리기

기존 `/now/write`의 개념을 바꾼다.

기존:

```text
글쓰기
→ 장소 선택
→ 혼잡도 선택
→ 내용 작성
→ 사진
→ 등록
```

앞으로:

```text
지금 알리기
→ 어느 장소?
→ 지금 어떤가요?
→ 필요한 경우 추가 정보
→ 현장 Signal 생성
```

장소 상세에서 들어오면 장소 선택을 생략한다.

```text
스타벅스 안양역점의
지금을 알려주세요.
```

필수:

```text
장소 + 현재 상태
```

선택:

```text
추가 Signal
내용
사진
```

상태 선택만으로 제출 가능해야 한다.

```text
지금 어떤가요?

[🟢 여유]
[🟡 보통]
[🔴 혼잡]
```

장소 유형별 추가 질문:

카페:

```text
좌석
[많아요] [조금 있어요] [거의 없어요]

소음
[조용해요] [보통] [시끄러워요]
```

음식점:

```text
대기
[없음] [1~5팀] [6~10팀] [10팀 이상]
```

팝업:

```text
대기
[바로 입장] [짧은 대기] [긴 대기]

재고/굿즈
[충분] [일부 품절] [대부분 품절]
```

## 9.6 6-6 알림

알림은 게시물 알림이 아니라 장소 변화 알림이다.

기존:

```text
누가 글을 썼어요
```

앞으로:

```text
내가 관심 있는 장소가 달라졌어요
```

예:

```text
런던 베이글 뮤지엄 안국점

🟢 지금 여유로워졌어요.

혼잡 → 보통 → 여유
3분 전
```

원칙:

- PlaceFollow 중심
- meaningful status change 중심
- OfficialUpdate 알림 유지
- Freshness 관련 알림은 필요 시 사용
- 사람 팔로우 알림 제거
- 좋아요 알림 없음
- 댓글 알림은 현장 대화 답변 정도만 유지
- 장기적으로 PlaceFollow별 알림 설정 지원

## 9.7 6-7 마이

마이는 인기 프로필이 아니라 장소 활동 기록이다.

기존:

```text
게시물 14
팔로워 32
팔로잉 28
```

삭제 방향.

새 구조:

```text
마이

최민준

내 장소
관심 장소 8
현장 기록 21
현장 확인 14

관심 장소
카페A 식당B 공원C

내 현장 기록

성수 OO카페
🔴 혼잡 · 현장 확인
오늘 14:32
```

허용:

```text
이번 달
12개 장소의 지금을
18번 확인했어요.
```

금지:

```text
상위 3% 기여자
지역 랭킹 4위
```

## 9.8 6-8 현장 기록 / 현장 대화

Comment 시스템은 유지하되 개념을 바꾼다.

기존:

```text
Post
 └ Comment
```

미래:

```text
Place
 └ PlaceUpdate
      └ Field Conversation
```

목적:

```text
게시물 작성자와 소통 ❌
장소에 관한 부족한 현재 정보 보충 ⭕
```

예:

```text
Q. 지금 줄 어디까지인가요?
A. 입구 밖까지 있어요.
   현장 확인 · 방금 전
```

향후 후보:

```text
OO카페에 지금 계신 분께 질문
"지금 자리 있나요?"
```

Presence가 충분한 경우 근처/현장 참여자에게 질문을 전달할 수 있다. 단, 개인정보 때문에 현재 인원 수를 직접 노출하지 않는다.

## 9.9 6-9 AI 표현 방식

AI 탭을 만들지 않는다.

금지:

```text
🤖 AI에게 물어보세요
```

AI는 곳곳에 자연스럽게 들어간다.

장소:

```text
ago 요약

최근 15분 동안 혼잡 관련
현장 정보가 이어지고 있어요.

현재는 여유로운 방문이
어려울 가능성이 높아요.
```

지역:

```text
성수의 지금

카페는 전반적으로 붐비는 편이고,
서울숲 주변은 비교적 여유로워요.
```

반드시 구분:

```text
Observation = 관찰
Current Status = 현재 판단
Trend = 변화 방향
Prediction = 미래 예상
```

절대 섞지 않는다.

## 9.10 6-10 전체 사용자 Journey

Case A: 약속 장소가 이미 정해짐

```text
ago 실행
↓
장소 검색
↓
OO카페
↓
🔴 혼잡
↓
대기 7팀
↓
12분 전부터 혼잡 증가
↓
최근 정보 충분
↓
"지금은 여유로운 이용이 어려워요."
```

Case B: 장소가 아직 안 정해짐

```text
ago
↓
성수의 지금
↓
지금 갈 만한 곳
↓
🟢 OO카페
🟢 OO공원
🟡 OO베이커리
↓
지도 비교
↓
장소 상세
```

Case C: 실제 현장 도착

```text
ago
↓
Presence
↓
"OO카페 근처에 계신가요?"
↓
현재 상태
[여유] [보통] [혼잡]
↓
1 Tap
```

Case D: 기존 정보 확인

```text
🔴 혼잡
8분 전

지금도 맞나요?

[맞아요]
↓
Confirmation
↓
Confidence ↑
```

Case E: 상태 변화

```text
🔴 혼잡
↓
사용자: 달라졌어요
↓
🟡 보통
↓
추가 Evidence
↓
Core Engine
↓
Change Detection
↓
PlaceStatus 변경
↓
PlaceFollower Notification
```

---

## 10. Step 7 Missing Features 우선순위

### P0: ago. 정체성을 만드는 기능

이 8개가 없으면 ago.는 아직 장소 SNS에 가깝다.

1. `PlaceUpdate`
2. `PlaceStatus`
3. `Freshness Engine`
4. `Trust Engine`
5. `Confirmation`
6. `QuickSignal`
7. `Change Detection`
8. `External Place Search`

### P1: Network를 만드는 기능

1. `Presence Signal`
2. `PlaceFollow` 독립 모델
3. 장소 변화 알림
4. Structured Signals
5. Field Conversation
6. Neighborhood

### P2: Intelligence

1. AI Signal Extraction
2. AI Place Summary
3. AI Neighborhood Summary
4. Visit Decision Support

### P3: Merchant

1. BusinessAccount
2. Merchant Place Claim
3. OfficialUpdate
4. 매장 운영 Signal
5. Merchant Dashboard

### P4: 충분한 데이터 이후

- Prediction
- 시간대 패턴
- 이상 탐지
- 고급 개인화
- Place Intelligence Analytics
- POS/IoT 연동
- Merchant API
- 지역 단위 고급 분석

특히 Prediction은 지금 만들지 않는다. 데이터가 없기 때문이다.

MVP 핵심 Loop:

```text
실제 장소
   ↓
Signal
   ↓
Freshness + Trust
   ↓
PlaceStatus
   ↓
지금도 맞아요?
   ↓
새 Signal
```

---

## 11. Step 8 Development Roadmap Reset

### Phase 0: 현재 코드 보존

목표:

- 현재 프로젝트 상태를 안정적으로 commit/push
- 기존 기능을 기준점으로 남김
- 대규모 삭제부터 하지 않음

주의:

- 기존 구현은 버릴 코드가 아니라 마이그레이션 기반이다.
- `feature/now-community`의 실제 최신 코드와 Git 상태를 먼저 확인한다.

### Phase 1: Place Infrastructure

목표:

```text
서울/경기의 실제 장소를 ago.에서 검색 가능
```

작업:

- Neighborhood 모델 도입
- Place 외부 소스 구조 도입
- Kakao Place Search 연결
- ago Place와 외부 Place 매칭

주의:

```text
Kakao 데이터 사용 = Kakao Map SDK 강제 아님
```

지도 렌더러와 데이터 구조를 분리한다.

### Phase 2: PlaceUpdate Migration

현재:

```text
Post(kind='now')
```

이동:

```text
PlaceUpdate
```

재사용 가능:

- status
- content
- image
- author
- place
- visitVerified

### Phase 3: QuickSignal + Confirmation

ago.다운 경험이 강하게 나타나는 단계다.

구현:

```text
지금 어떤가요?
🟢 🟡 🔴
```

그리고:

```text
지금도 맞아요
달라졌어요
```

### Phase 4: Core Engine v1

첫 번째 핵심 기술 Phase.

```text
Freshness
+
Trust
+
Evidence Aggregation
↓
PlaceStatus
```

v1은 설명 가능한 deterministic engine으로 시작한다. AI부터 만들지 않는다.

### Phase 5: Place Detail v2

장소 상세를 새 구조로 구현한다.

```text
장소
↓
지금
↓
Freshness / Confidence
↓
상태 변화
↓
Confirmation
↓
현장 Evidence
```

### Phase 6: NOW / Map v2

NOW:

```text
사람의 최신 글
→ 지역의 최신 장소 상황
```

Map:

```text
PlaceStatus 기반 marker
```

### Phase 7: Location Graph

작업:

- User Follow 제거
- PlaceFollow 독립 모델 도입
- 알림을 New Post에서 PlaceStatus Change로 이동
- Profile을 My Places / Contributions로 변경

### Phase 8: Presence

작업:

- 위치 권한 UX
- 주변 Kakao Place 매칭
- 장소 단위 Presence Signal 생성
- Privacy/플랫폼 정책 검토

원칙:

```text
개인 이동 추적이 아니라 장소 단위 Signal
```

### Phase 9: Structured Signals

카페/음식점부터 시작한다.

```text
waitingTeams
waitingMinutes
seatAvailability
parkingAvailability
noiseLevel
```

카테고리별 Signal Registry를 확장한다.

### Phase 10: AI Layer

그제야 AI.

```text
PlaceUpdate
↓
Signal Extraction

PlaceStatus
↓
AI Summary

Neighborhood Status
↓
AI Regional Summary
```

AI는 Core Engine 위에 올라간다.

### Phase 11: Merchant

작업:

- BusinessAccount
- OfficialUpdate
- Place Claim
- Merchant Dashboard

이후 B2B 가능성 검토.

---

## 12. 기존 기능 유지/수정/삭제/마이그레이션 표

| 현재 기능 | 처리 | 최종 방향 |
|---|---|---|
| Place | 강화/재사용 | 외부 Place와 연결되는 중심 Entity |
| NOW Post | PlaceUpdate로 Migration | 현장 Evidence |
| Map | 재사용 후 개선 | PlaceStatus 기반 지도 |
| Place Detail | 대폭 개선 | 방문 판단 핵심 화면 |
| Write | 지금 알리기로 변경 | QuickSignal/PlaceUpdate 입력 |
| Comment | Field Conversation으로 변경 | 장소 현재 정보 보완 대화 |
| Notification | Place Change 중심으로 변경 | 관심 장소 변화 알림 |
| Profile | Contribution 중심으로 변경 | 내 장소/내 현장 기록 |
| Place Follow | 강화 + 독립 모델화 | Location Graph |
| User Follow | 제거 | 사람 중심 관계망 방지 |
| Followers | 제거 | 인기 지표 제거 |
| Following | 제거 | 사람 중심 UX 제거 |
| Like | 도입 안 함 | Confirmation으로 대체 |
| Image Upload | Evidence로 재사용 | 현장 정보 보강 |
| Visit Verified | Trust Signal로 강화 | Evidence weight |
| 최근 현장 기록 | PlaceStatus History로 발전 | 장소 시간축 |
| 조회수 | 약화/숨김 | 필요 시 내부 분석만 |
| 일반 Post | 핵심 모델에서 제외 | 나중에 필요 시 별도 콘텐츠로 재검토 |

---

## 13. 최종 Product Architecture

```text
                  REAL WORLD

                     Place
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      User          Merchant       External
        │              │              │
        ▼              ▼              ▼
   PlaceUpdate    OfficialUpdate    Baseline
   QuickSignal
   Confirmation
   Presence
        │
        └──────────────┬──────────────┘
                       ▼
                 Evidence Layer
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Freshness            Trust
              └────────┬────────┘
                       ▼
                CORE ENGINE
                       │
                       ▼
                  PlaceStatus
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
       NOW            Map         Place Detail
        │                             │
        ▼                             ▼
 Neighborhood                    AI Summary
 Intelligence                    Visit Decision
                                      │
                                      ▼
                                    User
                                      │
                                      ▼
                              New Field Signal
                                      │
                                      └──────↺
```

---

## 14. AI 원칙

### 14.1 AI의 위치

AI는 Location Intelligence의 설명 계층이다.

```text
Evidence
↓
Freshness / Trust
↓
Core Engine
↓
PlaceStatus
↓
AI Interpretation
```

### 14.2 AI가 할 수 있는 것

- 현재 상황 요약
- 방문 판단 보조
- 사용자 자연어에서 structured signal 추출
- 상태 변화 이유 설명
- 동네 전체 상황 요약
- 신호 충돌 설명
- 이상 정보 탐지 보조

### 14.3 AI가 하면 안 되는 것

1. 데이터가 없는데 현재 상태를 만들기

```text
최근 현장 정보 없음
→ "아마 여유로울 거예요" 금지
```

2. 예측을 현재 상태처럼 보여주기

```text
현재 상태: unknown
참고: 평소 이 시간에는 붐비는 편
```

3. 사용자 원본보다 AI 추출값을 우선하기

4. Community/Merchant/External 출처를 숨기기

5. 모든 화면 진입마다 LLM을 호출하기

6. AI 탭을 만들고 제품 중심을 AI 챗봇으로 옮기기

### 14.4 AI Output 운영

- AI 요약은 특정 `PlaceStatus`에 연결한다.
- `PlaceStatus`가 바뀌면 기존 요약은 stale 처리한다.
- 단순 상태 문장은 template/rule로 처리한다.
- 복잡한 요약/충돌 설명/지역 요약만 AI를 사용한다.
- LLM 비용과 지연을 고려해 상태 변화 시점에 생성 후 캐시한다.

---

## 15. 개발 시 절대 지켜야 할 원칙

### 15.1 제품 원칙

1. ago.는 사람 중심 SNS가 아니다.
2. 장소가 주인공이다.
3. 사용자 이름/프로필은 보조 정보다.
4. 좋아요/팔로워/랭킹으로 가지 않는다.
5. `지금`은 게시물 피드가 아니라 지역 상황판이다.
6. `장소 상세`는 방문 판단 화면이다.
7. `지금 알리기`는 글쓰기 폼이 아니라 Signal 생성이다.
8. `unknown`은 실패가 아니라 정직한 상태다.

### 15.2 데이터 원칙

1. 외부 Place ID를 ago Place의 주키로 쓰지 않는다.
2. 원문과 구조화 데이터를 모두 저장한다.
3. AI 추출값과 사용자 직접 입력값을 구분한다.
4. Freshness와 Trust를 섞지 않는다.
5. PlaceStatus history를 남긴다.
6. Place.currentStatus snapshot도 둔다.
7. OfficialUpdate와 Community Evidence의 출처를 구분한다.
8. Presence는 개인 이동경로가 아니라 장소 단위 aggregate로 관리한다.

### 15.3 엔진 원칙

1. 최신 글 하나를 현재 상태로 쓰지 않는다.
2. 여러 Evidence를 종합한다.
3. 상태 변화와 정보 만료를 구분한다.
4. 새로운 정보가 없다고 상태가 좋아졌다고 추측하지 않는다.
5. Status Change Threshold와 Notification Threshold를 분리한다.
6. 초기 알고리즘은 deterministic/rule 기반으로 시작한다.
7. AI는 Core Engine 위에 올라간다.

### 15.4 UX 원칙

1. 위치 권한은 강제 벽이 아니다.
2. 위치 권한의 가치를 사용자에게 설명한다.
3. 현재 위치와 탐색 지역을 구분한다.
4. 지도에서 사람 수를 직접 노출하지 않는다.
5. 필수 입력은 장소 + 상태까지로 낮춘다.
6. 사진/글/세부 Signal은 선택이다.
7. AI는 자연스럽게 들어가야 하며 별도 목적지가 되면 안 된다.

### 15.5 개발 진행 원칙

1. Phase 0부터 순서대로 진행한다.
2. 대규모 삭제부터 하지 않는다.
3. 기존 기능을 새 구조로 마이그레이션한다.
4. 각 Phase마다 모델/API/UI/테스트 범위를 작게 나눈다.
5. Cursor Agent에게 여러 Phase를 한 번에 맡기지 않는다.
6. AI 에디터에게 작업을 줄 때는 반드시 이 문서의 해당 Phase와 금지 원칙을 함께 붙인다.

---

## 16. AI 에디터에 줄 작업 프롬프트 템플릿

아래 템플릿을 Cursor 등에 붙여서 사용한다.

```text
ago. 프로젝트의 최상위 기준 문서는 `ago-master-strategy-development-context.md`입니다.
이번 작업은 Step 8 Roadmap의 Phase [번호/이름]에 해당합니다.

반드시 지킬 원칙:
- ago.는 사람 중심 SNS가 아니라 Location First 서비스입니다.
- Place가 중심 Entity입니다.
- 좋아요/팔로워/사람 중심 피드 방향으로 구현하지 마세요.
- AI는 상태를 생성하지 않고 Core Engine 결과를 해석합니다.
- 현재 정보가 없으면 unknown을 유지합니다.
- 기존 구현을 무조건 삭제하지 말고, 필요한 경우 마이그레이션 경로를 제안하세요.

이번 작업 목표:
[구체 목표]

수정 범위:
[파일/모듈 범위]

완료 기준:
[동작/테스트/화면 확인 기준]

먼저 현재 코드 구조를 읽고, 수정 계획을 짧게 제시한 뒤 진행하세요.
```

---

## 17. 참고 출처

이 문서의 외부 검증에 사용한 주요 출처:

- Kakao Developers REST API Reference: https://developers.kakao.com/docs/en/rest-api/reference
- KIPRIS 지식재산정보 검색: https://kipris.or.kr/
- Google Maps Help, Busy Areas/Popular Times: https://support.google.com/maps/answer/11323117
- NOWN Google Play listing: https://play.google.com/store/apps/details?id=com.bluequest.nown
- 서울나우 App Store listing: https://apps.apple.com/kr/app/서울나우-seoulnow/id6758728536

상표 사용 가능성은 이 문서에서 확정하지 않는다. `ago`, `AGO`, `아고`, 유사 발음/철자, 관련 지정상품/서비스업에 대한 KIPRIS 및 전문가 검토가 별도로 필요하다.

