import { Expression, Project, SourceFile, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';

export class MorphTsBuilder {
    private _sourceFile: SourceFile;

    constructor(private _filePath: string) {
        const fileContent = fs.readFileSync(_filePath, 'utf8');
        const project = new Project();
        this._sourceFile = project.createSourceFile(_filePath, fileContent, { overwrite: true });
    }

    public intialStep(
        steps: Array<
            | MorphBuilderInitialStepType
            | MorphBuilderInitialStepVariable
            | MorphBuilderInitialStepModule
            | MorphBuilderInitialDefaultAssignment
        >,
    ) {
        return new MorphTs(steps, this._sourceFile, this._filePath);
    }
}

export class MorphTs {
    private _currentStep: Expression = undefined as any as Expression;

    constructor(
        private _steps: Array<
            | MorphBuilderInitialStepType
            | MorphBuilderInitialStepVariable
            | MorphBuilderInitialStepModule
            | MorphBuilderInitialDefaultAssignment
        >,
        private _sourceFile: SourceFile,
        private _filePath: string,
    ) {
        let initialValue: any;

        for (const _step of _steps) {
            if (isMorphBuilderInitialStepType(_step)) {
                initialValue = _sourceFile.getVariableDeclaration((v) =>
                    v
                        .getType()
                        .getText()
                        .includes((_step as MorphBuilderInitialStepType).initialVariableType),
                );

                if (!initialValue || initialValue === undefined) {
                    continue;
                }

                const intialStep = initialValue.getInitializer()?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

                this._currentStep = intialStep;
                return;
            } else if (isMorphBuilderInitialStepModule(_step)) {
                initialValue = _sourceFile
                    .getStatements()
                    .find((ea) => ea.getText().startsWith((_step as MorphBuilderInitialStepModule).initialModule))
                    ?.asKind(SyntaxKind.ExpressionStatement)
                    ?.getFirstChildByKind(SyntaxKind.BinaryExpression)
                    ?.getRight();

                if (!initialValue || initialValue === undefined) {
                    continue;
                }

                this._currentStep = initialValue;
                return;
            } else if (isMorphBuilderInitialStepVariable(_step)) {
                initialValue = _sourceFile.getVariableDeclaration(
                    (_step as MorphBuilderInitialStepVariable).initialVariable,
                );

                if (!initialValue || initialValue === undefined) {
                    continue;
                }

                const intialStep = initialValue.getInitializer()?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

                this._currentStep = intialStep;
                return;
            } else {
                initialValue = _sourceFile
                    .getExportAssignment(() => true)
                    ?.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression);

                if (!initialValue || initialValue === undefined) {
                    continue;
                }

                this._currentStep = initialValue;
                return;
            }
        }

        if (!this._currentStep || this._currentStep === undefined) {
            throw new Error(`Initial current step is not found`);
        }
    }

    public nextStep(step: MorphTsNextStep) {
        const previousStep = this._currentStep;

        const presentStep = previousStep
            ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            .getProperty(step.propertyName);

        if (!presentStep) {
            if (step.isRequired) {
                throw new Error(`Property ${step.propertyName} not found`);
            }

            previousStep
                ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
                .addPropertyAssignment({
                    name: step.propertyName,
                    initializer: JSON.stringify({}, null, 2),
                })
                .getParentIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        }

        const newPresentStep = previousStep
            ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            .getProperty(step.propertyName)
            ?.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        if (!newPresentStep || newPresentStep === undefined) {
            throw new Error(`Property ${step.propertyName} not found`);
        }

        this._currentStep = newPresentStep;

        return this;
    }

    public replaceStep(step: MorphTsReplaceStep) {
        this.nextStep({ propertyName: step.propertyName });

        const previousStep = this._currentStep;

        const presentStep = previousStep
            ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            .getParentIfKindOrThrow(SyntaxKind.PropertyAssignment)
            .setInitializer(JSON.stringify(step.replaceObject, null, 2))
            .getParentIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            .getProperty(step.propertyName)
            ?.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        if (!presentStep || presentStep === undefined) {
            throw new Error(`Property ${step.propertyName} not found`);
        }

        this._currentStep = presentStep;

        return this;
    }

    public save() {
        const updatedCode = this._sourceFile.getText();
        fs.writeFileSync(this._filePath, updatedCode, 'utf8');
    }
}

export interface MorphTsNextStep {
    propertyName: string;
    isRequired?: boolean;
}

export interface MorphTsReplaceStep {
    propertyName: string;
    replaceObject: any;
}

export interface MorphBuilderInitialStepVariable {
    initialVariable: string;
}

export interface MorphBuilderInitialStepType {
    initialVariableType: string;
}

export interface MorphBuilderInitialStepModule {
    initialModule: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MorphBuilderInitialDefaultAssignment {}

function isMorphBuilderInitialStepType(object: any): object is MorphBuilderInitialStepType {
    return 'initialVariableType' in object;
}

function isMorphBuilderInitialStepModule(object: any): object is MorphBuilderInitialStepModule {
    return 'initialModule' in object;
}

function isMorphBuilderInitialStepVariable(object: any): object is MorphBuilderInitialStepVariable {
    return 'initialVariable' in object;
}
