# 아껴맵 ERD 초안

## 엔티티 목록

초기 MVP는 `Place`를 중심으로 구현합니다. 리뷰와 신고는 Place 승인 흐름이 동작한 뒤 추가합니다.

```text
Place 1 --- N Review
Place 1 --- N Report
```

## Place

사용자가 제보한 장소 정보입니다. 승인 상태에 따라 일반 사용자에게 노출되는 범위가 달라집니다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | Long | 장소 ID |
| name | String | 장소 이름 |
| category | PlaceCategory | 장소 카테고리 |
| address | String | 주소 |
| latitude | Double | 위도 |
| longitude | Double | 경도 |
| priceInfo | String | 가격 정보 |
| description | String | 설명 |
| status | PlaceStatus | 장소 상태 |
| createdAt | LocalDateTime | 생성일시 |
| updatedAt | LocalDateTime | 수정일시 |

## Review

승인된 장소에 작성할 수 있는 리뷰입니다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | Long | 리뷰 ID |
| placeId | Long | 장소 ID |
| rating | Integer | 평점 |
| content | String | 리뷰 내용 |
| crowdedLevel | Integer | 혼잡도 |
| priceAccurate | Boolean | 가격 정보 정확 여부 |
| visitedDate | LocalDate | 방문일 |
| createdAt | LocalDateTime | 생성일시 |

## Report

잘못된 장소 정보나 부적절한 내용을 신고하는 내역입니다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | Long | 신고 ID |
| placeId | Long | 장소 ID |
| reason | ReportReason | 신고 사유 |
| content | String | 상세 내용 |
| createdAt | LocalDateTime | 생성일시 |

## PlaceStatus

| 값 | 설명 |
| --- | --- |
| PENDING | 사용자가 등록했지만 아직 관리자 승인을 받지 않은 상태 |
| APPROVED | 관리자가 승인하여 지도에 노출 가능한 상태 |
| REJECTED | 관리자가 반려한 상태 |
| HIDDEN | 신고 누적 또는 관리자 판단으로 숨김 처리된 상태 |

## PlaceCategory

| 값 | 표시명 |
| --- | --- |
| RESTAURANT | 식당 |
| CAFE | 카페 |
| STUDY_SPACE | 공부공간 |
| PRINT_COPY | 프린트/복사 |
| CONVENIENCE | 편의시설 |

## ReportReason

| 값 | 설명 |
| --- | --- |
| WRONG_PRICE | 가격 정보가 틀림 |
| CLOSED_PLACE | 폐업 또는 운영하지 않는 장소 |
| INAPPROPRIATE_CONTENT | 부적절한 내용 |
| DUPLICATED_PLACE | 중복 장소 |
| ETC | 기타 |

## 상태 변경 규칙

### Place

```text
PENDING -> APPROVED
PENDING -> REJECTED
APPROVED -> HIDDEN
HIDDEN -> APPROVED
```

- 장소 등록 시 기본 상태는 `PENDING`입니다.
- 일반 목록과 지도 마커 API는 `APPROVED` 상태만 반환합니다.
- 리뷰는 `APPROVED` 상태의 장소에만 작성할 수 있습니다.
- 신고가 누적되면 추후 자동으로 `HIDDEN` 처리할 수 있습니다.

## 초기 구현 메서드

`Place` 엔티티에는 상태 변경 의도를 드러내는 메서드를 둡니다.

```java
place.approve();
place.reject();
place.hide();
place.restore();
```
