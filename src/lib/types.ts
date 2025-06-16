
// export interface Issue {
//   id: number;
//   number: number;
//   title: string;
//   html_url: string;
//   state: "open" | "closed";
//   user: {
//     login: string;
//     avatar_url: string;
//   };
//   labels: {
//     id: number;
//     name: string;
//     color: string;
//   }[];
//   comments: number;
//   created_at: string;
//   body: string | null;
//   pull_request?: object;
// }


// src/lib/types.ts

// The original Issue type from the GitHub API
export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  comments: number;
  created_at: string;
  user: {
    login: string;
  };
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
  pull_request?: object;
  // --- AI-Generated Fields ---
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  rationale?: string;
}