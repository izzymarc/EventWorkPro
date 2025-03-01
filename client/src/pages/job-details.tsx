import { useQuery, useMutation } from "@tanstack/react-query";
import { Job, Proposal, Milestone } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { insertMilestoneSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function JobDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const jobId = params.id ? parseInt(params.id) : 0;
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: jobId > 0,
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<
    Proposal[]
  >({
    queryKey: ["/api/jobs", jobId, "proposals"],
    enabled: !!jobId,
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<
    Milestone[]
  >({
    queryKey: ["/api/jobs", jobId, "milestones"],
    enabled: !!jobId,
  });

  const milestoneForm = useForm({
    resolver: zodResolver(insertMilestoneSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      dueDate: undefined,
      jobId,
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST",
        `/api/jobs/${jobId}/milestones`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/jobs", jobId, "milestones"],
      });
      toast({
        title: "Milestone Created",
        description: "The milestone has been created successfully.",
      });
      setShowMilestoneForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMilestoneStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "completed" | "approved" | "released";
    }) => {
      const res = await apiRequest("PATCH", `/api/milestones/${id}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/jobs", jobId, "milestones"],
      });
      toast({
        title: "Status Updated",
        description: "The milestone status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (jobLoading || proposalsLoading || milestonesLoading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription>{job.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not available'}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Budget: ${job.budget}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Milestones</h2>
              {user?.userType === "client" && job.clientId === user.id && (
                <Dialog open={showMilestoneForm} onOpenChange={setShowMilestoneForm}>
                  <DialogTrigger asChild>
                    <Button>Add Milestone</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Milestone</DialogTitle>
                      <DialogDescription>
                        Add a new milestone to break down the project into manageable
                        steps.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...milestoneForm}>
                      <form
                        onSubmit={milestoneForm.handleSubmit((data) =>
                          createMilestoneMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={milestoneForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={milestoneForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={milestoneForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (USD)</FormLabel>
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

                        <FormField
                          control={milestoneForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  {...field}
                                  value={
                                    field.value
                                      ? new Date(field.value)
                                          .toISOString()
                                          .slice(0, 16)
                                      : ""
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
                          disabled={createMilestoneMutation.isPending}
                        >
                          Create Milestone
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {milestones.map((milestone) => (
                <Card key={milestone.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                    <CardDescription>
                      Status: {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${milestone.amount}
                      </div>
                      {milestone.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date set'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {user?.userType === "vendor" &&
                      milestone.status === "pending" && (
                        <Button
                          onClick={() =>
                            updateMilestoneStatusMutation.mutate({
                              id: milestone.id,
                              status: "completed",
                            })
                          }
                          disabled={updateMilestoneStatusMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}
                    {user?.userType === "client" &&
                      user.id === job.clientId &&
                      milestone.status === "completed" && (
                        <Button
                          onClick={() =>
                            updateMilestoneStatusMutation.mutate({
                              id: milestone.id,
                              status: "approved",
                            })
                          }
                          disabled={updateMilestoneStatusMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve & Fund Escrow
                        </Button>
                      )}
                    {user?.userType === "client" &&
                      user.id === job.clientId &&
                      milestone.status === "approved" && (
                        <Button
                          onClick={() =>
                            updateMilestoneStatusMutation.mutate({
                              id: milestone.id,
                              status: "released",
                            })
                          }
                          disabled={updateMilestoneStatusMutation.isPending}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Release Payment
                        </Button>
                      )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Proposals</h2>
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    ${proposal.price} - {proposal.status}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {proposal.coverLetter}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
