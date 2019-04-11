import { expect, stage } from '@integration/testing-tools';
import { Ensure, equals } from '@serenity-js/assertions';

import { by } from 'protractor';
import { Attribute, Click, Navigate, Target } from '../../../src';
import { pageFromTemplate } from '../../fixtures';
import { UIActors } from '../../UIActors';

describe('Click', () => {

    const Bernie = stage(new UIActors()).actor('Bernie');

    const Form = {
        Checkbox: Target.the('checkbox').located(by.id('no-spam-please')),
    };

    /** @test {Click} */
    /** @test {Click.on} */
    it('allows the actor to click on an element', () => Bernie.attemptsTo(
        Navigate.to(pageFromTemplate(`
            <html>
                <body>
                    <form>
                        <input type="checkbox" id="no-spam-please" />
                    </form>
                </body>
            </html>
        `)),

        Click.on(Form.Checkbox),

        Ensure.that(Attribute.of(Form.Checkbox).called('checked'), equals('true')),
    ));

    /** @test {Click#toString} */
    it(`provides a sensible description of the interaction being performed`, () => {
        expect(Click.on(Form.Checkbox).toString())
            .to.equal('#actor clicks on the checkbox');
    });
});