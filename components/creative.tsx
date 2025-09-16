"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home,
  Grid3X3,
  Folder,
  Briefcase,
  BookOpen,
  Search,
  Bell,
  Settings,
  User,
  Download,
  Play,
  Star,
  Clock,
  Zap,
  Palette,
  Camera,
  Video,
  Code,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Target,
  Upload,
  Plus,
} from "lucide-react"

export function Creative() {
  const [activeTab, setActiveTab] = useState("home")

  const recentApps = [
    { name: "Photoshop", icon: "🎨", status: "Updated", color: "bg-blue-500" },
    { name: "Illustrator", icon: "✨", status: "New", color: "bg-orange-500" },
    { name: "After Effects", icon: "🎬", status: "Updated", color: "bg-purple-500" },
    { name: "Premiere Pro", icon: "🎥", status: "Active", color: "bg-indigo-500" },
  ]

  const recentFiles = [
    { name: "Brand Identity.ai", type: "Illustrator", modified: "2 hours ago", size: "12.4 MB" },
    { name: "Website Mockup.psd", type: "Photoshop", modified: "5 hours ago", size: "45.2 MB" },
    { name: "Logo Animation.aep", type: "After Effects", modified: "1 day ago", size: "128.7 MB" },
    { name: "Product Video.prproj", type: "Premiere Pro", modified: "2 days ago", size: "2.1 GB" },
  ]

  const activeProjects = [
    { name: "E-commerce Redesign", progress: 75, team: 4, deadline: "Dec 15" },
    { name: "Mobile App UI", progress: 45, team: 2, deadline: "Dec 20" },
    { name: "Brand Guidelines", progress: 90, team: 3, deadline: "Dec 10" },
  ]

  const creativeApps = [
    { name: "Photoshop", category: "Photo Editing", rating: 4.9, downloads: "50M+", icon: Palette },
    { name: "Illustrator", category: "Vector Graphics", rating: 4.8, downloads: "25M+", icon: Layers },
    { name: "After Effects", category: "Motion Graphics", rating: 4.7, downloads: "15M+", icon: Video },
    { name: "Premiere Pro", category: "Video Editing", rating: 4.8, downloads: "20M+", icon: Play },
    { name: "InDesign", category: "Layout Design", rating: 4.6, downloads: "10M+", icon: BookOpen },
    { name: "XD", category: "UI/UX Design", rating: 4.5, downloads: "8M+", icon: Sparkles },
  ]

  const learningContent = [
    { title: "Advanced Photoshop Techniques", duration: "2h 30m", level: "Advanced", students: "12.5K" },
    { title: "Motion Graphics Fundamentals", duration: "3h 15m", level: "Beginner", students: "8.2K" },
    { title: "Brand Identity Design", duration: "1h 45m", level: "Intermediate", students: "15.7K" },
    { title: "Video Editing Masterclass", duration: "4h 20m", level: "Advanced", students: "9.8K" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Designali Creative
                </h1>
                <p className="text-sm text-gray-600">Your Creative Workspace</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search apps, files, tutorials..."
                  className="pl-10 w-80 bg-white/50 border-gray-200/50"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Creative Pro</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-md">
            <TabsTrigger value="home" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </TabsTrigger>
            <TabsTrigger value="apps" className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Apps</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2">
              <Folder className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Learn</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-8 mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back, Creative Pro!
              </h2>
              <p className="text-gray-600 text-lg">Ready to bring your ideas to life?</p>
            </div>

            {/* Recent Apps */}
            <section>
              <h3 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <span>Recent Apps</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentApps.map((app, index) => (
                  <Card
                    key={index}
                    className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`${app.color} p-3 rounded-xl text-white text-2xl group-hover:scale-110 transition-transform`}
                        >
                          {app.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{app.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recent Files */}
            <section>
              <h3 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
                <Folder className="h-6 w-6 text-blue-600" />
                <span>Recent Files</span>
              </h3>
              <Card className="bg-white/60 backdrop-blur-md border-0">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 hover:bg-white/50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <Palette className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-600">
                              {file.type} • {file.size}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{file.modified}</p>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Active Projects */}
            <section>
              <h3 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-indigo-600" />
                <span>Active Projects</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeProjects.map((project, index) => (
                  <Card
                    key={index}
                    className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{project.name}</h4>
                          <Badge variant="outline">{project.deadline}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-600">{project.team} members</span>
                          </div>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Community Highlights */}
            <section>
              <h3 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
                <Award className="h-6 w-6 text-yellow-600" />
                <span>Community Highlights</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-6 w-6" />
                        <span className="font-semibold">Trending Design</span>
                      </div>
                      <h4 className="text-xl font-bold">Minimalist UI Trends 2024</h4>
                      <p className="text-white/80">
                        Discover the latest minimalist design trends that are shaping the creative industry.
                      </p>
                      <Button variant="secondary" size="sm">
                        Explore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-6 w-6" />
                        <span className="font-semibold">Featured Tutorial</span>
                      </div>
                      <h4 className="text-xl font-bold">Advanced Animation Techniques</h4>
                      <p className="text-white/80">Master complex animation workflows with our comprehensive guide.</p>
                      <Button variant="secondary" size="sm">
                        Watch Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Apps Tab */}
          <TabsContent value="apps" className="space-y-8 mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Creative Apps</h2>
              <p className="text-gray-600">Discover and manage your creative tools</p>
            </div>

            {/* App Categories */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button variant="outline" className="bg-white/50">
                All Apps
              </Button>
              <Button variant="ghost">Photo Editing</Button>
              <Button variant="ghost">Vector Graphics</Button>
              <Button variant="ghost">Video Editing</Button>
              <Button variant="ghost">Motion Graphics</Button>
              <Button variant="ghost">UI/UX Design</Button>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creativeApps.map((app, index) => (
                <Card
                  key={index}
                  className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <app.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{app.rating}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{app.name}</h4>
                        <p className="text-sm text-gray-600">{app.category}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{app.downloads} downloads</span>
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
                          Install
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* New Releases */}
            <section>
              <h3 className="text-2xl font-semibold mb-6">New Releases</h3>
              <Card className="bg-white/60 backdrop-blur-md border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-xl">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">Creative Suite 2024</h4>
                      <p className="text-gray-600">
                        The latest version with AI-powered features and enhanced performance
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800 mb-2">New</Badge>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Installing... 75%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-8 mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">File Manager</h2>
              <p className="text-gray-600">Organize and access your creative assets</p>
            </div>

            {/* File Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline">New Folder</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input placeholder="Search files..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* File Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentFiles.map((file, index) => (
                <Card
                  key={index}
                  className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Palette className="h-12 w-12 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium truncate">{file.name}</h4>
                        <p className="text-sm text-gray-600">{file.type}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{file.size}</span>
                        <span>{file.modified}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-8 mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Project Management</h2>
              <p className="text-gray-600">Track and manage your creative projects</p>
            </div>

            {/* Project Actions */}
            <div className="flex items-center justify-between">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="outline">Templates</Button>
                <Button variant="outline">Import</Button>
              </div>
            </div>

            {/* Active Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project, index) => (
                <Card
                  key={index}
                  className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{project.name}</h4>
                        <Badge variant="outline">{project.deadline}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600">{project.team} members</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm">Open</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Project Templates */}
            <section>
              <h3 className="text-2xl font-semibold mb-6">Project Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-500 to-blue-500 text-white border-0 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Camera className="h-12 w-12" />
                      <div>
                        <h4 className="font-semibold text-lg">Brand Identity</h4>
                        <p className="text-white/80">Complete brand identity package template</p>
                      </div>
                      <Button variant="secondary" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-pink-500 text-white border-0 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Video className="h-12 w-12" />
                      <div>
                        <h4 className="font-semibold text-lg">Video Campaign</h4>
                        <p className="text-white/80">Social media video campaign template</p>
                      </div>
                      <Button variant="secondary" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Code className="h-12 w-12" />
                      <div>
                        <h4 className="font-semibold text-lg">Web Design</h4>
                        <p className="text-white/80">Modern website design template</p>
                      </div>
                      <Button variant="secondary" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-8 mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Learning Hub</h2>
              <p className="text-gray-600">Enhance your creative skills with tutorials and courses</p>
            </div>

            {/* Featured Course */}
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <Badge className="bg-white/20 text-white">Featured Course</Badge>
                    <h3 className="text-3xl font-bold">Master Creative Workflows</h3>
                    <p className="text-white/80 text-lg">
                      Learn advanced techniques to streamline your creative process and boost productivity.
                    </p>
                    <div className="flex items-center space-x-4">
                      <Button variant="secondary" size="lg">
                        Start Learning
                      </Button>
                      <div className="flex items-center space-x-2 text-white/80">
                        <Clock className="h-4 w-4" />
                        <span>6 hours</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-64 h-40 bg-white/10 rounded-xl flex items-center justify-center">
                      <Play className="h-16 w-16 text-white/60" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Categories */}
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="bg-white/50">
                All Courses
              </Button>
              <Button variant="ghost">Beginner</Button>
              <Button variant="ghost">Intermediate</Button>
              <Button variant="ghost">Advanced</Button>
              <Button variant="ghost">Design</Button>
              <Button variant="ghost">Animation</Button>
              <Button variant="ghost">Photography</Button>
            </div>

            {/* Learning Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningContent.map((course, index) => (
                <Card
                  key={index}
                  className="bg-white/60 backdrop-blur-md border-0 hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Play className="h-12 w-12 text-purple-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{course.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{course.duration}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {course.level}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{course.students}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">Start Course</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Learning Stats */}
            <section>
              <h3 className="text-2xl font-semibold mb-6">Your Learning Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/60 backdrop-blur-md border-0">
                  <CardContent className="p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-purple-600">12</div>
                      <p className="text-gray-600">Courses Completed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-md border-0">
                  <CardContent className="p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-blue-600">48h</div>
                      <p className="text-gray-600">Learning Time</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-md border-0">
                  <CardContent className="p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-green-600">85%</div>
                      <p className="text-gray-600">Average Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
