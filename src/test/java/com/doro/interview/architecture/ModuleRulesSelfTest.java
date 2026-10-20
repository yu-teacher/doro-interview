package com.doro.interview.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 규칙이 비어 있는 코드에서도 통과하기만 하는 "항상 초록" 테스트가 되지 않았는지 확인한다.
 * fixture 패키지에는 의도적으로 규칙을 어기는 클래스가 있고, 같은 규칙이 그것을 실패로 잡아야 한다.
 */
class ModuleRulesSelfTest {

    private static final String FIXTURE = "com.doro.interview.architecture.fixture";

    private final JavaClasses classes = new ClassFileImporter().importPackages(FIXTURE);

    @Test
    void catalog가_quiz를_쓰는_위반을_잡는다() {
        assertThatThrownBy(() -> catalogRule().check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("catalog");
    }

    @Test
    void common이_catalog를_쓰는_위반을_잡는다() {
        assertThatThrownBy(() -> ruleFor("common 모듈은").check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("common");
    }

    @Test
    void SDK를_api가_직접_쓰는_위반을_잡는다() {
        assertThatThrownBy(() -> ruleFor("Doro SDK").check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("Doro SDK");
    }

    @Test
    void quiz가_progress의_read_밖을_쓰는_위반만_잡는다() {
        assertThatThrownBy(() -> ruleFor("quiz 모듈은 progress.read").check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("BadQuiz")
                .hasMessageNotContaining("GoodQuiz");
    }

    @Test
    void 위반_예시가_실제로_존재한다() {
        assertThat(classes.contain("com.doro.interview.architecture.fixture.api.BadSdkUser")).isTrue();
        assertThat(classes.contain("com.doro.interview.architecture.fixture.catalog.BadCatalog")).isTrue();
        assertThat(classes.contain("com.doro.interview.architecture.fixture.common.BadCommon")).isTrue();
    }

    private ArchRule catalogRule() {
        return ruleFor("catalog 모듈은");
    }

    private ArchRule ruleFor(String descriptionPrefix) {
        return ModuleRules.all(FIXTURE).stream()
                .filter(r -> r.getDescription().startsWith(descriptionPrefix))
                .findFirst().orElseThrow();
    }
}
