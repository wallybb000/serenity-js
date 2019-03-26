import { EventRecorder, expect, PickEvent } from '@integration/testing-tools';
import { ArtifactGenerated } from '@serenity-js/core/lib/events';
import { Photo } from '@serenity-js/core/lib/model';
import { Stage } from '@serenity-js/core/lib/stage';

import { Photographer, TakePhotosOfInteractions } from '../../../../src/stage';
import { create } from '../create';
import { Perform } from '../fixtures';

describe('Photographer', () => {

    describe(`when instructed to take a photo of all interactions`, () => {

        let photographer: Photographer,
            stage: Stage,
            recorder: EventRecorder;

        beforeEach(() => {
            const testSubject = create();
            stage = testSubject.stage;
            recorder = testSubject.recorder;

            photographer = new Photographer(new TakePhotosOfInteractions(), stage);
            stage.manager.register(photographer);
        });

        it(`takes a photo when the interaction goes well`, () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatSucceeds(1),
            )).to.be.fulfilled.then(() => stage.manager.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ArtifactGenerated, event => {
                        expect(event.name.value).to.equal(`Betty succeeds (#1)`);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it(`takes a photo when a problem occurs`, () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatFailsWith(Error),
            )).to.be.rejected.then(() => stage.manager.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ArtifactGenerated, event => {
                        expect(event.name.value).to.equal(`Betty fails due to Error`);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it(`takes only one photo, even though nested tasks might all be marked as failing`, () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.taskWith(
                    Perform.taskWith(
                        Perform.interactionThatFailsWith(TypeError),
                    ),
                ),
            )).to.be.rejected.then(() => stage.manager.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ArtifactGenerated, event => {
                        expect(event.name.value).to.equal(`Betty fails due to TypeError`);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it(`takes one photo per interaction`, () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatSucceeds(1),
                Perform.interactionThatSucceeds(2),
            )).to.be.fulfilled.then(() => stage.manager.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ArtifactGenerated, event => {
                        expect(event.name.value).to.equal(`Betty succeeds (#1)`);
                        expect(event.artifact).to.be.instanceof(Photo);
                    })
                    .next(ArtifactGenerated, event => {
                        expect(event.name.value).to.equal(`Betty succeeds (#2)`);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));
    });
});