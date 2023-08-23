import { Expression, Project, SourceFile, SyntaxKind } from "ts-morph";
import * as fs from 'fs';

export class MorphTsBuilder {
    private _sourceFile: SourceFile;

    constructor(private _filePath: string) {
        const fileContent = fs.readFileSync(_filePath, 'utf8');
        const project = new Project();
        this._sourceFile = project.createSourceFile(_filePath, fileContent, { overwrite: true });
    }

    public intialStep(initialVariable: string) {
        return new MorphTs(initialVariable, this._sourceFile, this._filePath);
    }
}

export class MorphTs {
    private _currentStep: Expression;

    constructor(private _initialVariable: string, private _sourceFile: SourceFile, private _filePath: string) {
        const initialValue = _sourceFile.getVariableDeclaration(_initialVariable);

        if (!initialValue || initialValue === undefined) {
            throw new Error(`Initial variable ${_initialVariable} not found`);
        }

        const intialStep = initialValue.getInitializer()
            ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        if (!intialStep || intialStep === undefined) {
            throw new Error(`Initial variable ${_initialVariable} is not an object`);
        }

        this._currentStep = intialStep;
    }

    public nextStep(step: MorphTsNextStep) {
        let previousStep = this._currentStep;

        let presentStep = previousStep
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
                    initializer: JSON.stringify({}, null, 2)
                })
                .getParentIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        }

        let newPresentStep = previousStep
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

        let previousStep = this._currentStep;

        let presentStep = previousStep
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
    replaceObject?: Object;
}