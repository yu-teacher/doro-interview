---
slug: "cch-13"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "Redis Sentinel과 Redis Cluster는 각각 무엇을 해결하나요?"
keywords: ["Sentinel 자동 페일오버", "센티널 최소 3대", "Cluster 16384 해시 슬롯", "CRC16 나머지로 슬롯 결정", "다중 키는 같은 슬롯", "해시 태그"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/", "https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/", "https://redis.io/docs/latest/develop/using-commands/keyspace/"]
concepts: [redis, db-scaling]
importance: 2
---
**모범 답변 (30~60초)**
Sentinel은 복제로 구성한 비클러스터 Redis의 고가용성을 위한 별도 프로세스입니다. 마스터와 복제본을 감시하다가 여러 센티널이 마스터 장애에 동의하면 복제본을 마스터로 승격하고 클라이언트에 새 주소를 알려 주며, 안정적으로 쓰려면 센티널을 최소 세 대 둡니다. Cluster는 데이터를 여러 노드에 자동으로 나누는 수평 확장 방식으로, 키의 CRC16을 16384로 나눈 나머지인 해시 슬롯에 배정하고 노드가 슬롯 일부를 맡습니다. 여러 키를 한 명령으로 다루려면 모두 같은 슬롯이어야 해서 키 이름에 해시 태그를 씁니다. 둘 다 비동기 복제라 확인된 쓰기가 유실될 수 있습니다.

```
CLUSTER KEYSLOT user:{123}:profile    # 5970
CLUSTER KEYSLOT user:{123}:account    # 5970 (같은 해시 태그 -> 같은 슬롯)
```

(공식 문서) Sentinel 페이지는 모니터링, 알림, 자동 페일오버, 클라이언트용 설정 제공을 하고, 여러 센티널이 합의해 장애를 판단하며, 견고한 배포에는 최소 3개가 필요하고, 비동기 복제라 확인된 쓰기가 유지된다는 보장은 없다고 한다. Scaling(Cluster) 페이지는 일관 해싱이 아니라 16384개 해시 슬롯을 쓰고 슬롯은 키의 CRC16을 16384로 나눈 값이며, 노드 추가·제거는 슬롯 이동만으로 가능하고, 여러 키 연산은 같은 해시 슬롯이어야 하며 해시 태그로 강제할 수 있고, 비동기 복제 때문에 확인된 쓰기가 유실될 수 있다고 한다. 해시 태그는 Keyspace 페이지에도 설명된다.
(실험 확인) `--cluster-enabled yes`로 띄운 Redis 7.4.11 노드 하나에서 `CLUSTER KEYSLOT user:1`은 10778, `user:{123}:profile`과 `user:{123}:account`는 둘 다 5970이었다. 슬롯 0~16383을 모두 배정한 뒤 `MSET a 1 b 2`는 `CROSSSLOT Keys in request don't hash to the same slot` 오류, `MSET {u}a 1 {u}b 2`는 성공이었고, `SELECT 1`은 클러스터 모드에서 허용되지 않는다는 오류였다. 노드 여러 대의 클러스터 구성, 센티널, 실제 페일오버는 실험하지 않았다.
