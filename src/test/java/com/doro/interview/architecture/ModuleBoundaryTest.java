package com.doro.interview.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/** 실제 코드(com.doro.interview)가 모듈 의존 규칙을 지키는지 검사한다. 위반하면 빌드가 실패한다. */
class ModuleBoundaryTest {

    private static final String BASE = "com.doro.interview";

    private final JavaClasses classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages(BASE);

    @Test
    void 모듈_의존_규칙을_지킨다() {
        for (ArchRule rule : ModuleRules.all(BASE)) {
            rule.check(classes);
        }
    }

    @Test
    void 모듈_사이에_순환이_없다() {
        slices().matching(BASE + ".(*)..").should().beFreeOfCycles().allowEmptyShould(true).check(classes);
    }
}
