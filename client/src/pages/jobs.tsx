import { useQuery, useMutation } from "@tanstack/react-query";
import { Job, Proposal } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProposalSchema } from "@shared/schema";
import { Loader2, Calendar, DollarSign } from "lucide-react";

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const proposalForm = useForm({
    resolver: zodResolver(insertProposalSchema),
    defaultValues: {
      jobId: 0,
      vendorId: user?.id,
      coverLetter: "",
      price: 0,
    },
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: Partial<Proposal>) => {
      const res = await apiRequest("POST", "/api/proposals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been sent to the client.",
      });
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <p className="text-muted-foreground">
          Browse and apply for event opportunities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs?.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription>{job.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not available'}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.budget}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Link href={`/jobs/${job.id}`}>
                <Button variant="secondary">View Details</Button>
              </Link>
              {user?.userType === "vendor" && (
                <Dialog
                  open={selectedJob?.id === job.id}
                  onOpenChange={(open) => setSelectedJob(open ? job : null)}
                >
                  <DialogTrigger asChild>
                    <Button>Submit Proposal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit a Proposal</DialogTitle>
                    </DialogHeader>
                    <Form {...proposalForm}>
                      <form
                        onSubmit={proposalForm.handleSubmit((data) =>
                          createProposalMutation.mutate({
                            ...data,
                            jobId: job.id,
                          })
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={proposalForm.control}
                          name="coverLetter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cover Letter</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Explain why you're the best fit for this job"
                                  className="h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={proposalForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proposed Price (USD)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={createProposalMutation.isPending}
                        >
                          {createProposalMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Submit Proposal
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
