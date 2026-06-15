'use client';

import { useSessions } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';
import { useEffect, useState } from 'react';

interface UseAdoptedRoadmapReturn {
  adoptedRoadmap: AiRoadmap | null;
  adoptedRoadmapId: string | null;
  isLoading: boolean;
}

export function useAdoptedRoadmap(settings: Record<string, string>): UseAdoptedRoadmapReturn {
  const [adoptedRoadmap, setAdoptedRoadmap] = useState<AiRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const adoptedRoadmapId = settings.adopted_roadmap_id ?? null;

  useEffect(() => {
    if (!adoptedRoadmapId) return;
    setIsLoading(true);
    supabase
      .from('ai_roadmaps')
      .select('*')
      .eq('id', adoptedRoadmapId)
      .single()
      .then(({ data }: { data: AiRoadmap | null }) => {
        setAdoptedRoadmap(data);
        setIsLoading(false);
      });
  }, [adoptedRoadmapId]);

  return { adoptedRoadmap, adoptedRoadmapId, isLoading };
}
