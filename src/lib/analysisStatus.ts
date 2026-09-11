import { invokeEdgeFunction } from './supabaseClient';

export interface AnalysisStatus {
openai: boolean;
gemini: boolean;
}

interface AnalysisStatusResponse {
ok: boolean;
result?: AnalysisStatus;
error?: {
code?: string;
message?: string;
};
}

export async function fetchAnalysisStatus(): Promise<AnalysisStatus> {
const { data, error } = await invokeEdgeFunction<AnalysisStatusResponse>(
'analysis-status',
{},
);

if (error) {
throw new Error('Could not retrieve AI provider configuration status.');
}

if (!data?.ok || !data.result) {
throw new Error(
data?.error?.message ??
'Could not retrieve AI provider configuration status.',
);
}

return data.result;
}
