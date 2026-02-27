import type { ProgramTemplate } from '$lib/jazz/types';
import type { BadgeVariant } from '$lib/shadcn/badge';

export type ProgramTemplateStatus = ProgramTemplate['status'];
export type ProgramTemplateFilter = 'all' | ProgramTemplateStatus;

export const PROGRAM_TEMPLATE_FILTER_OPTIONS: { key: ProgramTemplateFilter; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'draft', label: 'Draft' },
	{ key: 'published', label: 'Published' },
	{ key: 'archived', label: 'Archived' }
];

export const PROGRAM_TEMPLATE_STATUS_OPTIONS: { value: ProgramTemplateStatus; label: string }[] = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'published', label: 'Published' },
	{ value: 'archived', label: 'Archived' }
];

export const getProgramTemplateStatusBadgeVariant = (
	status: ProgramTemplateStatus
): BadgeVariant => {
	if (status === 'archived') {
		return 'secondary';
	}
	if (status === 'draft') {
		return 'outline';
	}
	return 'default';
};

export const canStartProgramTemplate = ({
	status,
	workoutCount,
	hasActiveRunForTemplate
}: {
	status: ProgramTemplateStatus;
	workoutCount: number;
	hasActiveRunForTemplate: boolean;
}) => status === 'published' && workoutCount > 0 && !hasActiveRunForTemplate;

export const getProgramTemplateStartDisabledReason = ({
	status,
	workoutCount
}: {
	status: ProgramTemplateStatus;
	workoutCount: number;
}) => {
	if (workoutCount <= 0) {
		return 'Add workouts first';
	}
	if (status === 'draft') {
		return 'Publish program first';
	}
	if (status === 'archived') {
		return 'Restore and publish program first';
	}
	return 'Program cannot be started';
};
