---
slug: "osp-10"
topic: "cs-os-process"
tier: DEEP
difficulty: 3
title: "리눅스 CFS는 어떻게 스케줄링하고, 지금은 어떻게 바뀌었나요?"
keywords: ["가장 작은 vruntime 선택", "이상적인 멀티태스킹 CPU", "레드-블랙 트리", "nice 한 단계당 1.25배", "6.6부터 EEVDF"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html", "https://www.kernel.org/doc/html/latest/scheduler/sched-eevdf.html", "https://man7.org/linux/man-pages/man7/sched.7.html"]
---
**모범 답변 (30~60초)**
CFS는 모든 태스크가 CPU를 똑같이 나눠 쓰는 이상적인 멀티태스킹 CPU를 실제 하드웨어에서 흉내 냅니다. 태스크마다 실행한 만큼 누적되는 가상 실행 시간 vruntime을 추적하고, 가장 적게 실행한 태스크, 곧 vruntime이 가장 작은 태스크를 다음에 고릅니다. 실행 가능한 태스크는 vruntime을 키로 하는 레드-블랙 트리에 정렬되어 맨 왼쪽이 뽑힙니다. nice 값은 스케줄러가 우대하는 정도에 반영되어 한 단계 차이마다 1.25배가 됩니다. 다만 커널 문서에 따르면 리눅스는 6.6부터 CFS에서 EEVDF로 옮겨 가는 중이고, EEVDF는 lag가 0 이상인 태스크 중 가상 데드라인이 가장 빠른 것을 고릅니다.

(공식 문서) 커널 CFS 문서(문서 버전 7.3.0)는 CFS가 2.6.23에 들어온 데스크톱 스케줄러이고 지금은 EEVDF에 자리를 내주는 중이라고 하며, 이상적인 멀티태스킹 CPU를 실제 하드웨어에서 모델링한다고 설명한다. 태스크의 vruntime(p->se.vruntime)을 추적해 항상 vruntime이 가장 작은 태스크를 실행하려 하고, 실행한 CPU 시간이 vruntime에 더해지며, 실행 가능한 태스크를 vruntime을 키로 하는 시간순 rbtree에 두고 가장 왼쪽 노드를 고른다고 한다. EEVDF 문서는 리눅스가 6.6에서 CFS를 대체하는 방향으로 전환하기 시작했고, 태스크의 lag가 0 이상인 것 중 가상 데드라인이 가장 빠른 것을 실행하며, 짧은 타임 슬라이스를 요청한 지연 민감 태스크가 유리해진다고 설명한다. sched(7)는 CFS(2.6.23) 이후 nice 값이 한 단계 차이날 때마다 스케줄러가 우대하는 정도가 1.25배가 된다고 하는데, 같은 문서가 기본 스케줄러를 아직 CFS라고 적고 있어 문서 사이에 버전 시차가 있다.
(보충) 이 질문은 리눅스 전용이라 macOS에서 실험하지 않았다. 문서는 EEVDF로 전환하는 중이라고만 적고 CFS 코드가 어느 버전에서 완전히 제거됐는지는 읽은 문서에 없으며, 기본 스케줄러가 현재 어느 쪽인지는 커널 버전에 따라 확인해야 한다. 1.25배가 EEVDF 전환 뒤에도 같은지는 읽은 문서로 확인하지 못했다.
