---
slug: "osm-12"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "시스템 콜은 일반 함수 호출과 무엇이 다르고, 왜 비용이 드나요? 줄이는 방법은 무엇인가요?"
keywords: ["유저 모드에서 커널 모드로 진입", "라이브러리 래퍼가 호출", "모드 전환 오버헤드", "호출 횟수를 줄이는 버퍼링", "vDSO로 커널 진입 회피"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://man7.org/linux/man-pages/man2/syscalls.2.html", "https://man7.org/linux/man-pages/man7/vdso.7.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 6장 Mechanism: Limited Direct Execution(6.2 Problem #1: Restricted Operations, Tip: Use Protected Control Transfer), PDF p.3-4"]
concepts: [process-management]
importance: 2
links: [{to: "osp-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
시스템 콜은 프로그램이 파일, 네트워크, 메모리 매핑 같은 커널 기능을 쓰기 위한 기본 인터페이스입니다. 보통 C 라이브러리의 래퍼 함수가 인자를 레지스터에 담아 커널로 진입하는 명령을 실행하고, CPU가 유저 모드에서 커널 모드로 전환해 처리한 뒤 돌아옵니다. 이 모드 전환과 커널 진입 경로 때문에 일반 함수 호출보다 훨씬 비쌉니다. 그래서 작은 입출력을 모아서 한 번에 보내는 버퍼링처럼 호출 횟수를 줄이는 것이 중요하고, 시간 조회처럼 아주 자주 쓰이는 일부 호출은 커널이 공유 메모리로 정보를 노출해 커널 진입 없이 처리하는 vDSO를 씁니다.

(공식 문서) `syscalls(2)`는 시스템 콜이 응용과 Linux 커널 사이의 기본 인터페이스이며 보통 glibc 래퍼가 인자를 올바른 레지스터에 옮긴 뒤 시스템 콜을 호출하고 `errno`를 설정한다고 한다. `vdso(7)`은 자주 쓰이는 시스템 콜은 호출 빈도와 사용자 공간을 나갔다 커널에 들어가는 문맥 전환 오버헤드 때문에 전체 성능을 좌우할 수 있고, 시스템 콜이 느릴 수 있다고 하며, 그래서 `gettimeofday`처럼 비밀이 아닌 정보를 프로세스가 접근할 수 있는 메모리에 두어 시스템 콜을 일반 함수 호출과 몇 번의 메모리 접근으로 바꾼다고 설명한다.
(실험 확인) macOS(Apple Silicon)에서 `/dev/null`에 1바이트 `write`를 200만 번 반복했을 때 호출당 약 350ns였고, 같은 횟수의 평범한 함수 호출은 컴파일 최적화 수준에 따라 약 0.5ns(`-O2`)~1.7ns(`-O0`)로 수백 배 차이가 났다. 1바이트 쓰기 200만 번을 `write` 직접 호출하면 약 700ms, 64KB 버퍼를 건 `fwrite`로 하면 약 25ms(약 27배 빠름)였다. 값은 이 머신·macOS에서의 측정이며 실행마다 조금씩 다르고 Linux에서는 다르다.
(원저자 자료) OSTEP 6장(Mechanism: Limited Direct Execution, PDF p.3-4)은 시스템 콜을 실행하려면 특별한 trap 명령을 써야 하고, 이 명령이 커널로 점프하면서 권한 수준을 커널 모드로 올리며 커널 작업이 끝나면 return-from-trap이 다시 사용자 모드로 내린다고 설명한다. trap 때 하드웨어는 돌아올 수 있도록 프로그램 카운터·플래그 등 레지스터 일부를 프로세스별 커널 스택에 저장하고, 호출한 쪽이 점프할 주소를 지정할 수 없으므로 커널이 부팅 때 만든 trap 테이블로만 진입 코드를 정한다고 한다. 따라서 시스템 콜이 일반 함수 호출과 다른 점(권한 전환, 레지스터 저장, 정해진 진입점)은 OSTEP으로 확인된다.
(보충) 작은 입출력을 모아 보내는 버퍼링이 호출 횟수를 줄인다는 설명은 OSTEP에서 시스템 콜 횟수 관점으로는 확인하지 못했다. "유저/커널 모드 전환 비용" 자체의 크기나 원인(캐시·TLB 영향, 보안 완화 조치 등)은 CPU와 커널 버전에 따라 달라서 일반 수치로 확인하지 못했다(OSTEP 6장 숙제는 시스템 콜 비용을 직접 측정해 보라고만 한다).
