---
slug: "osp-12"
topic: "cs-os-process"
tier: DEEP
difficulty: 2
title: "조건 변수는 왜 mutex와 같이 쓰고, 왜 while 루프로 조건을 검사해야 하나요?"
keywords: ["wait가 mutex를 원자적으로 해제", "깨어난 뒤 mutex 재획득", "while로 predicate 재검사", "spurious wakeup", "signal 유실"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_cond_wait.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_cond_signal.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Condition Variables (threads-cv), 30.1 Definition and Routines(상태 변수의 필요), PDF p.4-5", "OSTEP, Condition Variables (threads-cv), 30.2 The Producer/Consumer (Bounded Buffer) Problem, PDF p.9-10", "OSTEP, Condition Variables (threads-cv), Tip: Use While (Not If) For Conditions, PDF p.14"]
concepts: [race-condition]
importance: 2
links: [{to: "jt-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
조건 변수는 어떤 조건이 참이 될 때까지 스레드를 재우고 깨우는 장치인데, 조건 자체는 공유 변수라서 mutex로 보호해야 합니다. cond_wait는 mutex를 풀고 잠드는 일을 원자적으로 해서 그 사이에 다른 스레드가 조건을 바꾸고 signal해도 놓치지 않고, 깨어나면 mutex를 다시 잡고 돌아옵니다. 그래도 깨어났다고 조건이 참이라는 보장은 없습니다. 가짜 깨어남이 있을 수 있고, 다른 스레드가 먼저 조건을 소비했을 수도 있어서 while로 다시 검사해야 합니다. 또 signal은 기다리는 스레드가 없으면 사라지므로 상태는 조건 변수가 아니라 변수에 남겨야 합니다.

(공식 문서) POSIX pthread_cond_wait는 mutex를 원자적으로 풀고 블록하며(그 뒤 다른 스레드가 mutex를 잡고 signal하면 이미 블록한 것처럼 동작), 성공 반환 시 mutex가 다시 잠겨 호출 스레드가 소유한다고 한다. 조건 대기마다 공유 변수에 대한 불리언 predicate가 있고, 가짜 깨어남(spurious wakeup)이 일어날 수 있어 반환 후 predicate를 다시 평가해야 하며, 대기를 "while loop"에 넣어 predicate를 검사하는 것을 권장한다. pthread_cond_signal 문서의 설명 절은 가짜 깨어남을 허용하는 덕분에 응용이 predicate 검사 루프를 쓰게 된다고 말하고, signal은 기다리는 스레드가 없으면 아무 효과가 없으며 적어도 하나의 대기 스레드를 깨운다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 생산자가 먼저 ready=1로 바꾸고 signal한 뒤에 소비자가 predicate 검사 없이 wait하면 1초짜리 timedwait가 ETIMEDOUT으로 끝났다(일반 wait였다면 영원히 대기). while(!ready) 루프로 검사하면 곧바로 통과했다. wait에서 돌아온 스레드가 곧바로 같은 mutex에 trylock하면 EBUSY가 나와 mutex를 다시 쥔 채 돌아왔음을 확인했다. 가짜 깨어남 자체는 재현하지 못했다.
(원저자 자료) OSTEP 조건 변수 장(threads-cv)은 시그널이 대기 스레드를 깨우기만 하는 힌트일 뿐, 깨운 스레드가 실행될 때 상태가 여전히 원하는 대로라는 보장이 없다고 설명한다. 생산자-소비자 예에서 생산자가 값을 넣고 소비자를 깨운 뒤 그 소비자가 실행되기 전에 다른 소비자가 끼어들어 값을 먼저 가져가면, 깨어난 소비자는 뮤텍스를 다시 잡고 돌아와 빈 버퍼에서 꺼내려다 실패한다고 추적해 보이며, 이 의미를 Mesa 의미론이라 부르고 사실상 모든 시스템이 쓴다고 한다. 해법은 if를 while로 바꿔 깨어난 뒤 조건을 다시 검사하는 것이고 책은 항상 while을 쓰라고 권하며, 일부 스레드 패키지에서 생기는 가짜 깨어남도 같은 방식으로 처리된다고 한다. 또 시그널을 보낼 때 기다리는 스레드가 없으면 그 시그널은 사라져 나중에 wait한 스레드가 영영 잠들 수 있으므로, 완료 여부 같은 상태를 담는 변수(done)를 두고 락으로 보호해야 한다고 설명한다.
