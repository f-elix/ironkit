<script lang="ts">
	import { page } from '$app/state';
	import WorkoutEditor from '$lib/components/training-log/WorkoutEditor.svelte';
	import { CoState } from 'jazz-tools/svelte';
	import { Workout } from '$lib/jazz/schema';

	const workoutId = $derived(page.params.id!);

	const workoutState = new CoState(Workout, () => workoutId, {
		resolve: {
			performanceGroups: {
				$each: {
					performances: {
						$each: {
							exercise: true,
							performanceSets: { $each: true }
						}
					}
				}
			}
		}
	});

	const workout = $derived(workoutState.current.$isLoaded ? workoutState.current : undefined);
</script>

{#key workoutId}
	{#if workout}
		<div class="min-h-full" style="view-transition-name: workout;">
			<WorkoutEditor {workout} />
		</div>
	{/if}
{/key}
