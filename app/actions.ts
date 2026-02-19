
// app/actions.ts

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing in environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function createProject(userId: string, name: string, description: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('Projects')
    .insert([{ user_id: userId, name, description }])
    .select();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  revalidatePath('/projects');
  return data;
}

export async function deleteProject(projectId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('Projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  revalidatePath('/projects');
}

export async function fetchProjects(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('Projects')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data;
}

export async function logCrash(projectId: string, logData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('Logs & Crashes')
    .insert([{ project_id: projectId, ...logData }])
    .select();

  if (error) {
    throw new Error(`Failed to log crash: ${error.message}`);
  }

  return data;
}

export async function startTestRun(projectId: string, platform: string, version: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('TestRuns')
    .insert([{ project_id: projectId, platform, version, status: 'pending', timestamp: new Date().toISOString() }])
    .select();

  if (error) {
    throw new Error(`Failed to start test run: ${error.message}`);
  }

  // Trigger Python worker for test run
  await triggerPythonWorker('start-test-run', { testRunId: data[0].id });

  revalidatePath('/test-runs');
  return data;
}

export async function triggerPythonWorker(action: string, payload: any) {
  const response = await fetch('/api/trigger-worker', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    throw new Error('Failed to trigger Python worker');
  }

  return response.json();
}