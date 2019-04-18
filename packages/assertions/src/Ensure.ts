import { Answerable, AnswersQuestions, AssertionError, Interaction, LogicError, RuntimeError } from '@serenity-js/core';
import { formatted } from '@serenity-js/core/lib/io';
import { match } from 'tiny-types';

import { Expectation } from './Expectation';
import { ExpectationMet, ExpectationNotMet, Outcome } from './outcomes';

export class Ensure<Actual> extends Interaction {
    static that<A>(actual: Answerable<A>, expectation: Expectation<any, A>): Ensure<A> {
        return new Ensure(actual, expectation);
    }

    constructor(
        protected readonly actual: Answerable<Actual>,
        protected readonly expectation: Expectation<Actual>,
    ) {
        super();
    }

    performAs(actor: AnswersQuestions): PromiseLike<void> {
        return Promise.all([
            actor.answer(this.actual),
            actor.answer(this.expectation),
        ]).
        then(([ actual, expectation ]) =>
            expectation(actual).then(outcome =>
                match<Outcome<any, Actual>, void>(outcome)
                    .when(ExpectationNotMet, o => {
                        throw this.errorForOutcome(o);
                    })
                    .when(ExpectationMet, _ => void 0)
                    .else(o => {
                        throw new LogicError(formatted `An Expectation should return an instance of an Outcome, not ${ o }`);
                    }),
                ),
            );
    }

    toString(): string {
        return formatted `#actor ensures that ${ this.actual } does ${ this.expectation }`;
    }

    otherwiseFailWith(typeOfRuntimeError: new (message: string, cause?: Error) => RuntimeError, message?: string): Interaction {
        return new EnsureOrFailWithCustomError(this.actual, this.expectation, typeOfRuntimeError, message);
    }

    protected errorForOutcome(outcome: Outcome<any, Actual>): RuntimeError {
        return this.asAssertionError(outcome);
    }

    protected asAssertionError(outcome: Outcome<any, Actual>) {
        return new AssertionError(
            `Expected ${ formatted`${ this.actual }` } to ${ outcome.message }`,
            outcome.expected,
            outcome.actual,
        );
    }
}

class EnsureOrFailWithCustomError<Actual> extends Ensure<Actual> {
    constructor(
        actual: Answerable<Actual>,
        expectation: Expectation<Actual>,
        private readonly typeOfRuntimeError: new (message: string, cause?: Error) => RuntimeError,
        private readonly message?: string,
    ) {
        super(actual, expectation);
    }

    protected errorForOutcome(outcome: Outcome<any, Actual>): RuntimeError {
        const assertionError = this.asAssertionError(outcome);

        return new this.typeOfRuntimeError(this.message || assertionError.message, assertionError);
    }
}
