package com.doro.interview.architecture;

import com.tngtech.archunit.lang.ArchRule;

import java.util.List;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 모듈 의존 규칙(docs/DESIGN.md §6.0). 기준 패키지를 인자로 받아서, 실제 코드와 "일부러 위반한 예시"에 같은 규칙을 적용해
 * 규칙이 정말 위반을 잡는지 확인한다(ModuleRulesSelfTest).
 *
 * <pre>
 * common   -> (없음)   모든 모듈이 common 에 의존할 수 있다(응답 규격·예외)
 * account  -> (없음)
 * catalog  -> (없음)
 * progress -> catalog, account
 * quiz     -> catalog, account, progress.read(읽기 전용 패키지)
 * api      -> 전부 (아무도 api 에 의존하지 않는다)
 * </pre>
 *
 * 추가 규칙 R1: Doro SDK(com.hunnit_beasts.doro.sdk)는 account·config 패키지만 안다. 다른 모듈이 SDK 타입을 쓰면 SDK 변경이 곳곳을 흔든다.
 */
final class ModuleRules {

    private static final List<String> MODULES = List.of("common", "account", "catalog", "progress", "quiz", "api");

    private ModuleRules() {
    }

    static List<ArchRule> all(String base) {
        return List.of(
                forbid(base, "common", "account", "catalog", "progress", "quiz", "api"),
                forbid(base, "account", "catalog", "progress", "quiz", "api"),
                forbid(base, "catalog", "account", "progress", "quiz", "api"),
                forbid(base, "progress", "quiz", "api"),
                forbid(base, "quiz", "api"),
                quizDoesNotWriteProgress(base),
                sdkOnlyInAccountAndConfig(base));
    }

    private static ArchRule forbid(String base, String from, String... to) {
        String[] targets = java.util.Arrays.stream(to).map(m -> base + "." + m + "..").toArray(String[]::new);
        return noClasses().that().resideInAPackage(base + "." + from + "..")
                .should().dependOnClassesThat().resideInAnyPackage(targets)
                .as(from + " 모듈은 " + String.join(", ", to) + " 에 의존하지 않는다")
                .allowEmptyShould(true);
    }

    /** quiz 는 progress 의 쓰기 쪽(서비스·저장소 구현)을 쓰지 않는다: 읽기 전용 패키지(progress.read)만 허용한다(docs/M2-PLAN.md D10). */
    private static ArchRule quizDoesNotWriteProgress(String base) {
        return noClasses().that().resideInAPackage(base + ".quiz..")
                .should().dependOnClassesThat(
                        com.tngtech.archunit.base.DescribedPredicate.describe(
                                "progress 모듈에서 progress.read 밖의 클래스",
                                c -> c.getPackageName().startsWith(base + ".progress")
                                        && !c.getPackageName().equals(base + ".progress.read")
                                        && !c.getPackageName().startsWith(base + ".progress.read.")))
                .as("quiz 모듈은 progress.read 패키지만 쓴다. progress 에 쓰지 않는다")
                .allowEmptyShould(true);
    }

    /** R1: Doro SDK 를 import 하는 곳은 account 와 config 뿐이다. */
    private static ArchRule sdkOnlyInAccountAndConfig(String base) {
        return noClasses().that().resideOutsideOfPackages(base + ".account..", base + ".config..")
                .should().dependOnClassesThat().resideInAnyPackage("com.hunnit_beasts.doro.sdk..")
                .as("Doro SDK 는 account·config 만 안다(다른 모듈은 account.CurrentUser 같은 우리 인터페이스를 쓴다)")
                .allowEmptyShould(true);
    }

    static List<String> modules() {
        return MODULES;
    }
}
