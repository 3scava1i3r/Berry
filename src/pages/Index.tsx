// import { useState } from "react";
// import { useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { formatDistanceToNow } from "date-fns";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { GithubIcon } from "@/components/icons/GithubIcon";
// import { Issue } from "@/lib/types";
// import { toast } from "@/hooks/use-toast";
// import { GitBranch, MessageSquare, Star, ChevronDown, ChevronUp } from "lucide-react";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";

// const formSchema = z.object({
//   repoUrl: z.string().url("Please enter a valid URL.").regex(/github\.com\/[^\/]+\/[^\/]+/, "Please enter a valid GitHub repository URL."),
//   apiKey: z.string(),
// });

// type FormValues = z.infer<typeof formSchema>;

// const fetchIssues = async ({ repoUrl, page }: { repoUrl: string; page: number }): Promise<{ issues: Issue[]; totalPages: number, openIssuesCount?: number }> => {
//   const url = new URL(repoUrl);
//   const pathParts = url.pathname.split('/').filter(Boolean);
//   if (pathParts.length < 2) {
//     throw new Error("Invalid GitHub repository URL");
//   }
//   const [owner, repo] = pathParts;

//   let openIssuesCount: number | undefined;
//   if (page === 1) {
//     try {
//       const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
//       if (repoDetailsRes.ok) {
//         const repoData = await repoDetailsRes.json();
//         openIssuesCount = repoData.open_issues_count;
//       }
//     } catch (e) {
//       console.warn("Could not fetch repo details", e);
//     }
//   }

//   const perPage = 30;
//   const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&per_page=${perPage}&page=${page}`;
  
//   const response = await fetch(apiUrl);
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || "Failed to fetch issues.");
//   }
  
//   const issuesData: Issue[] = await response.json();
//   const issues = issuesData.filter(issue => !issue.pull_request);

//   const linkHeader = response.headers.get("Link");
//   let totalPages = 0;

//   if (linkHeader) {
//     const lastLink = linkHeader.split(',').find(s => s.includes('rel="last"'));
//     if (lastLink) {
//       const match = lastLink.match(/page=(\d+)/);
//       if (match) {
//         totalPages = parseInt(match[1], 10);
//       }
//     } else {
//       const nextLink = linkHeader.split(',').find(s => s.includes('rel="next"'));
//       if (nextLink) {
//         totalPages = page + 1;
//       } else {
//         totalPages = page;
//       }
//     }
//   } else if (issues.length > 0) {
//     totalPages = 1;
//   }

//   if (issues.length === 0 && page === 1) {
//       totalPages = 0;
//   }
  
//   return { issues, totalPages, openIssuesCount };
// };

// const fetchAndSummarizeRepo = async ({ repoUrl, apiKey }: { repoUrl: string; apiKey: string }): Promise<string> => {
//     if (!apiKey) {
//         throw new Error("Please provide a Gemini API key to generate a summary.");
//     }

//     const url = new URL(repoUrl);
//     const pathParts = url.pathname.split('/').filter(Boolean);
//     if (pathParts.length < 2) {
//         throw new Error("Invalid GitHub repository URL");
//     }
//     const [owner, repo] = pathParts;

//     const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
//     if (!readmeRes.ok) {
//         throw new Error("Failed to fetch README. The repository might be private or may not have a README file.");
//     }
//     const readmeData = await readmeRes.json();
//     const readmeContent = atob(readmeData.content);

//     const genAI = new GoogleGenerativeAI(apiKey);
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const prompt = `You are an expert software engineer. Summarize the following README file and describe what the repository is for in a few sentences. README content: \n\n${readmeContent}`;
    
//     try {
//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         const summary = response.text();
//         return summary;
//     } catch (error) {
//         console.error("Gemini API error:", error);
//         throw new Error("Failed to generate summary from Gemini API. Please check your API key and network connection.");
//     }
// };

// export default function Index() {
//   const [issues, setIssues] = useState<Issue[] | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(0);
//   const [currentRepoUrl, setCurrentRepoUrl] = useState<string | null>(null);
//   const [openIssuesCount, setOpenIssuesCount] = useState<number | null>(null);
//   const [repoSummary, setRepoSummary] = useState<string | null>(null);
//   const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       repoUrl: "",
//       apiKey: "",
//     },
//   });

//   const issueMutation = useMutation({
//     mutationFn: fetchIssues,
//     onSuccess: (data, variables) => {
//       setIssues(data.issues);
//       setTotalPages(data.totalPages);
//       if (data.openIssuesCount !== undefined) {
//           setOpenIssuesCount(data.openIssuesCount);
//       }
//       if (data.issues.length === 0 && variables.page === 1) {
//         toast({ title: "No open issues found in this repository." });
//       }
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//       setIssues(null);
//     },
//   });

//   const summaryMutation = useMutation({
//     mutationFn: fetchAndSummarizeRepo,
//     onSuccess: (data) => {
//       setRepoSummary(data);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Summary Failed",
//         description: error.message,
//         variant: "destructive",
//       });
//       setRepoSummary(null);
//     },
//   });

//   const onSubmit = (data: FormValues) => {
//     setIssues(null);
//     setOpenIssuesCount(null);
//     setRepoSummary(null);
//     setExpandedIssueId(null);
//     setCurrentRepoUrl(data.repoUrl);
//     setCurrentPage(1);
//     setTotalPages(0);
//     issueMutation.mutate({ repoUrl: data.repoUrl, page: 1 });
//     if(data.apiKey) {
//       summaryMutation.mutate({ repoUrl: data.repoUrl, apiKey: data.apiKey });
//     }
//   };

//   const handlePageChange = (newPage: number) => {
//     if (!currentRepoUrl || newPage < 1 || newPage > totalPages) return;
//     setCurrentPage(newPage);
//     setIssues(null);
//     setExpandedIssueId(null);
//     issueMutation.mutate({ repoUrl: currentRepoUrl, page: newPage });
//   };

//   const isLoading = issueMutation.isPending || summaryMutation.isPending;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
//       <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center">
//         <header className="text-center my-8 md:my-12">
//           <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
//             GitHub Issue Prioritizer
//           </h1>
//           <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
//             Enter a public GitHub repository URL and an optional Gemini API key to fetch, summarize, and prioritize its open issues.
//           </p>
//         </header>

//         <main className="w-full max-w-3xl">
//           <Card className="bg-card/50 backdrop-blur-sm border-border/50">
//             <CardHeader>
//               <Form {...form}>
//                 <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
//                   <FormField
//                     control={form.control}
//                     name="repoUrl"
//                     render={({ field }) => (
//                       <FormItem className="flex-grow">
//                         <FormControl>
//                           <div className="relative">
//                             <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
//                             <Input placeholder="e.g., https://github.com/facebook/react" {...field} className="pl-10" />
//                           </div>
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                    <FormField
//                     control={form.control}
//                     name="apiKey"
//                     render={({ field }) => (
//                       <FormItem>
//                          <FormLabel>Gemini API Key (Optional)</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Enter your Gemini API key for summaries" {...field} type="password" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
//                     {isLoading ? "Analyzing..." : "Analyze Repo"}
//                   </Button>
//                 </form>
//               </Form>
//             </CardHeader>
//           </Card>

//           <div className="mt-8">
//             {summaryMutation.isPending && (
//                 <Card className="mb-8">
//                     <CardHeader>
//                         <CardTitle>Repository Summary</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-2">
//                         <Skeleton className="h-4 w-full" />
//                         <Skeleton className="h-4 w-full" />
//                         <Skeleton className="h-4 w-3/4" />
//                     </CardContent>
//                 </Card>
//             )}
//             {repoSummary && (
//                 <Card className="mb-8 bg-card/70 animate-fade-in">
//                     <CardHeader>
//                         <CardTitle>Repository Summary</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <p className="text-foreground/90 whitespace-pre-wrap">{repoSummary}</p>
//                     </CardContent>
//                 </Card>
//             )}

//             {issueMutation.isPending && (
//               <div className="space-y-4">
//                 {[...Array(5)].map((_, i) => (
//                   <Card key={i}>
//                     <CardHeader>
//                       <Skeleton className="h-5 w-3/4" />
//                       <Skeleton className="h-4 w-1/4 mt-2" />
//                     </CardHeader>
//                     <CardContent>
//                       <Skeleton className="h-8 w-full mt-2" />
//                       <div className="flex gap-2 mt-4">
//                         <Skeleton className="h-5 w-20 rounded-full" />
//                         <Skeleton className="h-5 w-20 rounded-full" />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//             {issues && issues.length > 0 && (
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold tracking-tight">
//                   Open Issues {openIssuesCount !== null ? `(${openIssuesCount})` : ''}
//                 </h2>
//                 {issues.map((issue) => {
//                   const isExpanded = expandedIssueId === issue.id;
//                   return (
//                     <Card key={issue.id} className="hover:border-primary/50 transition-colors">
//                       <div className="cursor-pointer" onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}>
//                         <CardHeader>
//                           <div className="flex justify-between items-start gap-4">
//                               <a href={issue.html_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-grow">
//                                 <CardTitle className="text-lg hover:text-primary transition-colors">{issue.title}</CardTitle>
//                               </a>
//                               {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
//                           </div>
//                           <p className="text-sm text-muted-foreground mt-1">
//                             # {issue.number} opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })} by {issue.user.login}
//                           </p>
//                           {issue.body && (
//                             <CardDescription className="pt-2 text-foreground/80 whitespace-pre-wrap">
//                               {isExpanded ? issue.body : `${issue.body.substring(0, 150)}${issue.body.length > 150 ? '...' : ''}`}
//                             </CardDescription>
//                           )}
//                         </CardHeader>
//                       </div>
//                       <CardContent className="flex flex-wrap items-center gap-2">
//                         <Badge variant="secondary" className="gap-1.5">
//                           <GitBranch className="h-3.5 w-3.5" />
//                           {issue.state === 'open' ? 'Open' : 'Closed'}
//                         </Badge>
//                          <Badge variant="secondary" className="gap-1.5">
//                           <MessageSquare className="h-3.5 w-3.5" />
//                           {issue.comments}
//                         </Badge>
//                         <Badge variant="secondary" className="gap-1.5 font-semibold text-amber-400">
//                           <Star className="h-3.5 w-3.5" />
//                           {issue.comments}
//                         </Badge>
//                         {issue.labels.map(label => (
//                           <Badge key={label.id} variant="outline" style={{
//                             borderColor: `#${label.color}`,
//                             color: `#${label.color}`
//                           }}>
//                             {label.name}
//                           </Badge>
//                         ))}
//                       </CardContent>
//                     </Card>
//                   )
//                 })}
//               </div>
//             )}
//             {issues && issues.length === 0 && !issueMutation.isPending && (
//                <Card className="text-center py-12">
//                 <p className="text-muted-foreground">No open issues were found for this repository.</p>
//               </Card>
//             )}

//             {totalPages > 1 && (
//               <div className="mt-8 flex justify-center">
//                 <Pagination>
//                   <PaginationContent>
//                     <PaginationItem>
//                       <PaginationPrevious
//                         href="#"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handlePageChange(currentPage - 1);
//                         }}
//                         className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
//                       />
//                     </PaginationItem>
//                     <PaginationItem>
//                       <span className="px-4 py-2 text-sm">
//                         Page {currentPage} of {totalPages}
//                       </span>
//                     </PaginationItem>
//                     <PaginationItem>
//                       <PaginationNext
//                         href="#"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handlePageChange(currentPage + 1);
//                         }}
//                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
//                       />
//                     </PaginationItem>
//                   </PaginationContent>
//                 </Pagination>
//               </div>
//             )}
//           </div>
//         </main>

//         <footer className="mt-16 pb-8 text-center text-muted-foreground">
//           <p>
//             Built with ❤️ by{" "}
//             <a 
//               href="http://hritwik.netlify.app/" 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="text-primary hover:text-primary/80 transition-colors underline"
//             >
//               Hritwik
//             </a>
//           </p>
//         </footer>
//       </div>
//     </div>
//   );
// }


// src/pages/index.tsx

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Issue } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { GitBranch, MessageSquare, Star, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// --- FORM SCHEMA ---
const formSchema = z.object({
  repoUrl: z.string().url("Please enter a valid URL.").regex(/github\.com\/[^\/]+\/[^\/]+/, "Please enter a valid GitHub repository URL."),
  apiKey: z.string(), // API key is now optional in the logic, but required for AI features
});

type FormValues = z.infer<typeof formSchema>;

// --- API FUNCTIONS ---
const fetchIssues = async ({ repoUrl, page }: { repoUrl: string; page: number }): Promise<{ issues: Issue[]; totalPages: number, openIssuesCount?: number }> => {
  // ... (this function remains exactly the same)
  const url = new URL(repoUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error("Invalid GitHub repository URL");
  }
  const [owner, repo] = pathParts;

  let openIssuesCount: number | undefined;
  if (page === 1) {
    try {
      const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (repoDetailsRes.ok) {
        const repoData = await repoDetailsRes.json();
        openIssuesCount = repoData.open_issues_count;
      }
    } catch (e) {
      console.warn("Could not fetch repo details", e);
    }
  }

  const perPage = 30;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&per_page=${perPage}&page=${page}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch issues.");
  }
  
  const issuesData: Issue[] = await response.json();
  const issues = issuesData.filter(issue => !issue.pull_request);

  const linkHeader = response.headers.get("Link");
  let totalPages = 0;

  if (linkHeader) {
    const lastLink = linkHeader.split(',').find(s => s.includes('rel="last"'));
    if (lastLink) {
      const match = lastLink.match(/page=(\d+)/);
      if (match) {
        totalPages = parseInt(match[1], 10);
      }
    } else {
      const nextLink = linkHeader.split(',').find(s => s.includes('rel="next"'));
      if (nextLink) {
        totalPages = page + 1;
      } else {
        totalPages = page;
      }
    }
  } else if (issues.length > 0) {
    totalPages = 1;
  }

  if (issues.length === 0 && page === 1) {
      totalPages = 0;
  }
  
  return { issues, totalPages, openIssuesCount };
};

const fetchAndSummarizeRepo = async ({ repoUrl, apiKey }: { repoUrl: string; apiKey: string }): Promise<string> => {
    // ... (this function remains exactly the same)
    if (!apiKey) {
        throw new Error("Please provide a Gemini API key to generate a summary.");
    }

    const url = new URL(repoUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
    }
    const [owner, repo] = pathParts;

    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
    if (!readmeRes.ok) {
        throw new Error("Failed to fetch README. The repository might be private or may not have a README file.");
    }
    const readmeData = await readmeRes.json();
    const readmeContent = atob(readmeData.content);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an expert software engineer. Summarize the following README file and describe what the repository is for in a few sentences. README content: \n\n${readmeContent}`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();
        return summary;
    } catch (error) {
        console.error("Gemini API error:", error);
        throw new Error("Failed to generate summary from Gemini API. Please check your API key and network connection.");
    }
};

// --- NEW AI PRIORITIZATION FUNCTION ---
interface AIPriorityResponse {
  issue_number: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  rationale: string;
}

const prioritizeIssuesWithAI = async ({ issues, apiKey }: { issues: Issue[], apiKey: string }): Promise<AIPriorityResponse[]> => {
  if (!apiKey) {
    // This case should ideally be handled before calling, but as a safeguard:
    return []; 
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const simplifiedIssues = issues.map(issue => ({
    number: issue.number,
    title: issue.title,
    // Truncate body to keep the prompt concise
    body: issue.body.substring(0, 500),
    labels: issue.labels.map(l => l.name),
  }));

  const prompt = `
    You are an expert software engineering manager responsible for triaging tasks.
    Based on the following list of GitHub issues, assign a priority and a brief rationale for each.

    Prioritization Criteria:
    - 'Critical': Bugs breaking core functionality, security vulnerabilities, or blockers for a release.
    - 'High': Important features, bugs affecting a large number of users, or significant performance issues.
    - 'Medium': Nice-to-have features, minor bugs with workarounds, or technical debt.
    - 'Low': Cosmetic changes, documentation updates, typos, or minor optimizations.

    Analyze the issue's title, body, and labels to make your decision.

    Your response MUST be a valid JSON array of objects, with no other text before or after the array.
    Each object in the array must have the following structure: { "issue_number": number, "priority": "...", "rationale": "..." }

    Here is the list of issues:
    ${JSON.stringify(simplifiedIssues)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean the response to ensure it's valid JSON
    const jsonString = text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    
    return JSON.parse(jsonString) as AIPriorityResponse[];
  } catch (error) {
    console.error("Gemini API error during prioritization:", error);
    throw new Error("AI failed to prioritize issues. The model may have returned an invalid format.");
  }
};

// --- MAIN COMPONENT ---
export default function Index() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRepoUrl, setCurrentRepoUrl] = useState<string | null>(null);
  const [openIssuesCount, setOpenIssuesCount] = useState<number | null>(null);
  const [repoSummary, setRepoSummary] = useState<string | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: "",
      apiKey: "",
    },
  });

  // --- NEW PRIORITIZATION MUTATION ---
  const prioritizationMutation = useMutation({
    mutationFn: prioritizeIssuesWithAI,
    onSuccess: (prioritizedData) => {
      setIssues(prevIssues => {
        if (!prevIssues) return null;
        const priorityMap = new Map(prioritizedData.map(p => [p.issue_number, p]));
        return prevIssues.map(issue => {
          const priorityInfo = priorityMap.get(issue.number);
          if (priorityInfo) {
            return { ...issue, priority: priorityInfo.priority, rationale: priorityInfo.rationale };
          }
          return issue;
        });
      });
      toast({ title: "AI Prioritization Complete", description: "Issues have been rated and sorted." });
    },
    onError: (error: Error) => {
      toast({
        title: "AI Prioritization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const issueMutation = useMutation({
    mutationFn: fetchIssues,
    onSuccess: (data, variables) => {
      setIssues(data.issues);
      setTotalPages(data.totalPages);
      if (data.openIssuesCount !== undefined) {
          setOpenIssuesCount(data.openIssuesCount);
      }
      if (data.issues.length === 0 && variables.page === 1) {
        toast({ title: "No open issues found in this repository." });
      } else if (data.issues.length > 0) {
        // --- CHAIN THE MUTATIONS ---
        const apiKey = form.getValues("apiKey");
        if (apiKey) {
            prioritizationMutation.mutate({ issues: data.issues, apiKey });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIssues(null);
    },
  });

  const summaryMutation = useMutation({
    mutationFn: fetchAndSummarizeRepo,
    onSuccess: (data) => {
      setRepoSummary(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Summary Failed",
        description: error.message,
        variant: "destructive",
      });
      setRepoSummary(null);
    },
  });

  const onSubmit = (data: FormValues) => {
    setIssues(null);
    setOpenIssuesCount(null);
    setRepoSummary(null);
    setExpandedIssueId(null);
    setCurrentRepoUrl(data.repoUrl);
    setCurrentPage(1);
    setTotalPages(0);
    issueMutation.mutate({ repoUrl: data.repoUrl, page: 1 });
    if(data.apiKey) {
      summaryMutation.mutate({ repoUrl: data.repoUrl, apiKey: data.apiKey });
    } else {
        toast({ title: "Tip:", description: "Provide a Gemini API key to enable AI summaries and issue prioritization."})
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!currentRepoUrl || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setIssues(null);
    setExpandedIssueId(null);
    issueMutation.mutate({ repoUrl: currentRepoUrl, page: newPage });
  };

  const isLoading = issueMutation.isPending || summaryMutation.isPending;

  // --- HELPER FOR PRIORITY BADGE STYLING ---
  const getPriorityBadgeVariant = (priority?: 'Critical' | 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'default'; // Using default for a prominent color like primary
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'secondary';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center">
        <header className="text-center my-8 md:my-12">
            {/* ...header content... */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
            GitHub Issue Prioritizer
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Enter a public GitHub repository URL and an optional Gemini API key to fetch, summarize, and prioritize its open issues.
          </p>
        </header>

        <main className="w-full max-w-3xl">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            {/* ...form content... */}
             <CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="repoUrl"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <div className="relative">
                            <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="e.g., https://github.com/facebook/react" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Gemini API Key (Optional for AI features)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Gemini API key for summaries and prioritization" {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? "Analyzing..." : "Analyze Repo"}
                  </Button>
                </form>
              </Form>
            </CardHeader>
          </Card>

          <div className="mt-8">
            {/* ...summary section... */}
            {summaryMutation.isPending && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Repository Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            )}
            {repoSummary && (
                <Card className="mb-8 bg-card/70 animate-fade-in">
                    <CardHeader>
                        <CardTitle>Repository Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground/90 whitespace-pre-wrap">{repoSummary}</p>
                    </CardContent>
                </Card>
            )}

            {/* --- UPDATED ISSUES SECTION --- */}
            {issueMutation.isPending && (
              // ...skeleton loading for issues...
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-full mt-2" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {issues && issues.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  Open Issues {openIssuesCount !== null ? `(${openIssuesCount})` : ''}
                </h2>
                {issues.map((issue) => {
                  const isExpanded = expandedIssueId === issue.id;
                  return (
                    <Card key={issue.id} className="hover:border-primary/50 transition-colors">
                      <div className="cursor-pointer" onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}>
                        <CardHeader>
                          <div className="flex justify-between items-start gap-4">
                              <a href={issue.html_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-grow">
                                <CardTitle className="text-lg hover:text-primary transition-colors">{issue.title}</CardTitle>
                              </a>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                          </div>
                           <p className="text-sm text-muted-foreground mt-1">
                            # {issue.number} opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })} by {issue.user.login}
                          </p>
                          {/* --- NEW AI RATIONALE DISPLAY --- */}
                          {prioritizationMutation.isPending && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                          )}
                          {issue.priority && issue.rationale && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md animate-fade-in">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    AI Suggested Rationale
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{issue.rationale}</p>
                            </div>
                          )}
                           {issue.body && (
                            <CardDescription className="pt-4 text-foreground/80 whitespace-pre-wrap">
                              {isExpanded ? issue.body : `${issue.body.substring(0, 150)}${issue.body.length > 150 ? '...' : ''}`}
                            </CardDescription>
                          )}
                        </CardHeader>
                      </div>
                      <CardContent className="flex flex-wrap items-center gap-2">
                        {/* --- NEW AI PRIORITY BADGE --- */}
                        {prioritizationMutation.isPending && <Skeleton className="h-6 w-24 rounded-full" />}
                        {issue.priority && (
                           <Badge variant={getPriorityBadgeVariant(issue.priority)} className="gap-1.5 font-bold">
                               <Sparkles className="h-3.5 w-3.5" />
                               {issue.priority}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="gap-1.5">
                          <GitBranch className="h-3.5 w-3.5" />
                          {issue.state === 'open' ? 'Open' : 'Closed'}
                        </Badge>
                         <Badge variant="secondary" className="gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {issue.comments}
                        </Badge>
                        {issue.labels.map(label => (
                          <Badge key={label.id} variant="outline" style={{
                            borderColor: `#${label.color}`,
                            color: `#${label.color}`
                          }}>
                            {label.name}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            
            {/* ...no issues and pagination sections... */}
            {issues && issues.length === 0 && !issueMutation.isPending && (
               <Card className="text-center py-12">
                <p className="text-muted-foreground">No open issues were found for this repository.</p>
              </Card>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 py-2 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                         className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-16 pb-8 text-center text-muted-foreground">
          {/* ...footer content... */}
           <p>
            Built with ❤️ by{" "}
            <a 
              href="http://hritwik.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors underline"
            >
              Hritwik
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}