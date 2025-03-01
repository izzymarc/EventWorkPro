import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Search, BriefcaseIcon, DollarSign, MessageSquare, Camera, Music, Mic, Utensils, Award, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Job, Proposal } from "@shared/schema";
import { EVENT_CATEGORIES } from "@shared/schema";

const categoryIcons = {
  'Wedding': Camera,
  'Corporate Event': BriefcaseIcon,
  'Birthday Party': Music,
  'Conference': Mic,
  'Concert': Music,
  'Private Party': Utensils,
  'Exhibition': Award,
  'Other': Video,
};

export default function HomePage() {
  const { user } = useAuth();

  const { data: userJobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: user?.userType === "client",
  });

  const { data: userProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals", user?.id],
    enabled: user?.userType === "vendor",
  });

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Post Event Jobs",
      description:
        "Create detailed job postings for your upcoming events and connect with skilled professionals.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Find Professionals",
      description:
        "Browse through profiles of experienced event vendors and find the perfect match for your needs.",
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Browse Opportunities",
      description:
        "Discover event opportunities and submit proposals to showcase your expertise.",
    },
  ];

  const stats = user?.userType === "client"
    ? [
      {
        title: "Active Jobs",
        value: userJobs.filter(job => job.status === "open").length,
        icon: <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Total Proposals",
        value: userJobs.length,
        icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Total Budget",
        value: `$${userJobs.reduce((sum, job) => sum + job.budget, 0)}`,
        icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      },
    ]
    : [
      {
        title: "Submitted Proposals",
        value: userProposals.length,
        icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "Active Projects",
        value: userProposals.filter(prop => prop.status === "accepted").length,
        icon: <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />,
      },
    ];

  // Only show dashboard if user is logged in
  if (user) {
    return (
      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your {user?.userType === "client" ? "events" : "proposals"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.userType === "client" ? (
                <>
                  <Link href="/post-job">
                    <Button className="w-full">Post a New Job</Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full">View All Jobs</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/jobs">
                    <Button className="w-full">Find New Opportunities</Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full">Update Profile</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.userType === "client"
                ? userJobs.slice(0, 3).map((job, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.category}</p>
                    </div>
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))
                : userProposals.slice(0, 3).map((proposal, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Job #{proposal.jobId}</p>
                      <p className="text-sm text-muted-foreground capitalize">{proposal.status}</p>
                    </div>
                    <Link href={`/jobs/${proposal.jobId}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 py-8">
          {features.map((feature, i) => (
            <Card key={i} className="pt-4 group hover:shadow-lg transition-all duration-500 cursor-pointer">
              <CardContent className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">{feature.title}</h2>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent -z-10" />
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="container py-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-right">
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                Find the Perfect Event Professional for Your Next Event
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect with talented event professionals for weddings, corporate events,
                parties, and more. Get matched with the right vendor for your needs.
              </p>
              <div className="flex gap-6">
                <Link href="/auth">
                  <Button size="lg" className="text-lg px-8 py-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative">Get Started</span>
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-primary/5 transition-colors">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-left">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform lg:translate-x-8 transition-transform hover:scale-105 duration-700">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000"
                  alt="Event Planning"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse delay-500" />
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
        <div className="text-center mb-16 relative">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent inline-block">
            Browse by Category
          </h2>
          <p className="text-xl text-muted-foreground">
            Find professionals across different event categories
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EVENT_CATEGORIES.map((category) => {
            const IconComponent = categoryIcons[category] || Video;
            const categoryImages = {
              'Wedding': "https://images.unsplash.com/photo-1519741497674-611481863552",
              'Corporate Event': "https://images.unsplash.com/photo-1511578314322-379afb476865",
              'Birthday Party': "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
              'Conference': "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
              'Concert': "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
              'Private Party': "https://images.unsplash.com/photo-1496337589254-7e19d01cec44",
              'Exhibition': "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
              'Other': "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
            };
            return (
              <Link href="/auth" key={category}>
                <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative">
                  <div className="relative h-48">
                    <img
                      src={`${categoryImages[category]}?auto=format&fit=crop&w=800&q=80`}
                      alt={category}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 group-hover:from-black/70 group-hover:to-black/30 transition-colors duration-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white transform group-hover:scale-105 transition-transform duration-500">
                          <div className="inline-flex p-4 rounded-full bg-white/10 backdrop-blur-sm mb-3 group-hover:bg-white/20 transition-colors">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-lg">{category}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container py-24 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent inline-block">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple steps to find or become an event professional
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-8 w-8" />,
                title: "1. Post Your Event",
                description: "Describe your event needs and requirements",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "2. Get Proposals",
                description: "Receive proposals from qualified professionals",
              },
              {
                icon: <Calendar className="h-8 w-8" />,
                title: "3. Choose & Book",
                description: "Select the best match and start planning",
              },
            ].map((step, i) => (
              <Card key={i} className="group hover:shadow-xl transition-all duration-500">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-500">
                    {step.icon}
                  </div>
                  <CardTitle className="text-center group-hover:text-primary transition-colors">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Top Event Professionals</h2>
          <p className="text-muted-foreground">
            Work with the best talent in the industry
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              name: "Emily Johnson",
              role: "Wedding Photographer",
              image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
              rating: 4.9,
              jobs: 124,
            },
            {
              name: "Michael Chen",
              role: "Event Planner",
              image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
              rating: 4.8,
              jobs: 89,
            },
            {
              name: "Sarah Williams",
              role: "Caterer",
              image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
              rating: 4.9,
              jobs: 156,
            },
            {
              name: "David Kim",
              role: "DJ & Music",
              image: "https://images.unsplash.com/photo-1500048993953-d23a436266cf",
              rating: 4.7,
              jobs: 92,
            },
          ].map((pro, i) => (
            <Link href="/auth" key={i}>
              <Card className="group hover:shadow-lg transition-all duration-500 cursor-pointer overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={`${pro.image}?auto=format&fit=crop&w=800&q=80`}
                    alt={pro.name}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <CardContent className="text-center pt-4">
                  <h3 className="font-semibold text-lg">{pro.name}</h3>
                  <p className="text-muted-foreground">{pro.role}</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                    <span>⭐️ {pro.rating}</span>
                    <span>{pro.jobs} jobs</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What People Say</h2>
          <p className="text-muted-foreground">
            Hear from our satisfied clients and vendors
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "Found the perfect photographer for my wedding within days!",
              author: "Sarah M.",
              role: "Client",
            },
            {
              quote: "This platform has transformed how I find event opportunities.",
              author: "Michael R.",
              role: "Event Planner",
            },
            {
              quote: "The milestone payment system gives peace of mind.",
              author: "David K.",
              role: "Corporate Client",
            },
          ].map((testimonial, i) => (
            <Card key={i} className="group hover:shadow-lg transition-all duration-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-lg italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Event Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of event professionals and clients
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="group hover:bg-primary/80 transition-colors">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
