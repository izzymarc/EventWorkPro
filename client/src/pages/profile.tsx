import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Job, Proposal } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, MessageSquare, BriefcaseIcon, User as UserIcon, Mail } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      description: user?.description || "",
      skills: user?.skills || [],
      portfolio: user?.portfolio || [],
    },
  });

  const { data: userJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: user?.userType === "client",
  });

  const { data: userProposals, isLoading: proposalsLoading } = useQuery<
    Proposal[]
  >({
    queryKey: ["/api/proposals", user?.id],
    enabled: user?.userType === "vendor",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile information and view your activity
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserIcon className="w-10 h-10 text-primary" />
              </div>
              <CardTitle>{user?.fullName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Account Type</h3>
                  <Badge variant="secondary" className="capitalize">
                    {user?.userType}
                  </Badge>
                </div>
                {user?.userType === "vendor" && user.skills && (
                  <div>
                    <h3 className="font-medium mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, i) => (
                        <Badge key={i} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.userType === "client" ? (
                <>
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4 text-muted-foreground" />
                    <span>{userJobs?.length || 0} Posted Jobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {userJobs?.reduce(
                        (sum, job) =>
                          sum +
                          (job.proposals?.length || 0),
                        0
                      ) || 0}{" "}
                      Received Proposals
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span>{userProposals?.length || 0} Submitted Proposals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {userProposals?.filter((p) => p.status === "accepted")
                        .length || 0}{" "}
                      Accepted Proposals
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Tabs defaultValue="edit" className="space-y-6">
            <TabsList>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) =>
                        updateProfileMutation.mutate(data)
                      )}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about yourself"
                                className="h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.userType === "vendor" && (
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skills</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter skills separated by commas"
                                  value={field.value?.join(", ")}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updateProfileMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    View your recent {user?.userType === "client" ? "jobs" : "proposals"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {user?.userType === "client"
                      ? userJobs?.map((job) => (
                          <div key={job.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{job.title}</h3>
                              <Badge>{job.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not available'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${job.budget}
                              </span>
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        ))
                      : userProposals?.map((proposal) => (
                          <div key={proposal.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">
                                Proposal for Job #{proposal.jobId}
                              </h3>
                              <Badge>{proposal.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {proposal.coverLetter}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'Date not available'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${proposal.price}
                              </span>
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
