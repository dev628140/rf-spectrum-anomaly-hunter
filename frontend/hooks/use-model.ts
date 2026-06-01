"use client";

import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

const API =
  "http://127.0.0.1:8000";

type ModelSelectionResponse = {

  success?: boolean;

  active_model?: string;

  current_model?: string;

  message?: string;
};

type HistoryItem = {

  id?: number;

  from_model?: string;

  to_model?: string;

  model?: string;

  timestamp?: string;
};

async function switchModelRequest(
  model: string
): Promise<ModelSelectionResponse> {

  const response =
    await fetch(
      `${API}/api/model/select`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model
        })
      }
    );

  if (!response.ok) {

    const text =
      await response.text();

    throw new Error(
      text ||
      "Failed to switch model"
    );
  }

  return response.json();
}

async function fetchModelHistory():
Promise<HistoryItem[]> {

  const response =
    await fetch(
      `${API}/api/history/model-switches`
    );

  if (!response.ok) {

    throw new Error(
      "Failed to fetch model history"
    );
  }

  const payload =
    await response.json();

  /*
  CASE 1:
  {
    status: "OK",
    data: [...]
  }
  */

  if (
    Array.isArray(
      payload.data
    )
  ) {

    return payload.data;
  }

  /*
  CASE 2:
  {
    history: [...]
  }
  */

  if (
    Array.isArray(
      payload.history
    )
  ) {

    return payload.history;
  }

  /*
  CASE 3:
  [...]
  */

  if (
    Array.isArray(payload)
  ) {

    return payload;
  }

  return [];
}

export function useSwitchModel() {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn:
      switchModelRequest,

    onSuccess: () => {

      queryClient.invalidateQueries({

        queryKey: [
          "model-history"
        ]
      });
    }
  });
}

export function useModelHistory() {

  return useQuery({

    queryKey: [
      "model-history"
    ],

    queryFn:
      fetchModelHistory,

    refetchInterval:
      3000
  });
}