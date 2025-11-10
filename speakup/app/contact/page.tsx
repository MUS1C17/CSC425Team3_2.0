"use client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general",
    message: "",
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form:", form);
    alert("Message sent. We’ll get back to you shortly.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="w-full px-6 md:px-10 xl:px-16 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold tracking-tight text-3xl">SpeakUp</Link>

          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="outline" className="rounded-xl border-border">Log in</Button></Link>
            <Link href="/auth/sign-up">
              <Button 
                variant="outline"
                className="rounded-xl px-4 border-border text-foreground">
                Sign up
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button 
                variant="outline" 
                className="rounded-xl px-4 border-border text-foreground">
                Join Live Session
              </Button>
            </Link>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Wide Hero Band */}
      <section className="w-full border-b border-border">
        <div className="w-full px-6 md:px-10 xl:px-16 py-12">
          <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-black leading-[1.05]">
            Get help. Give feedback. Say hi.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-[80ch]">
            We answer fast and read everything. Tell us what’s working, what isn’t, or what you’d love to see next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#:~:text=learning%20feel%20easy.”-,FAQs,-How%20does%20SpeakUp">
              <Button variant="outline" className="rounded-xl px-5 border-border">View FAQs</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="rounded-xl px-5 border-border">See Features</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Strip (3-up) */}
      <section className="w-full border-b border-border">
        <div className="w-full px-6 md:px-10 xl:px-16 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Email</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>support@speakup.app</span>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl px-3 py-1 h-8 border-border"
                  onClick={() => navigator.clipboard.writeText("support@speakup.app")}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Typical response</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Under 24 hours on weekdays. We triage urgent classroom issues first.
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">System status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Everything should be green. If not, we’ll post updates.
              <div className="mt-3">
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Split Layout: Left help panel / Right form */}
      <section className="w-full">
        <div className="w-full px-6 md:px-10 xl:px-16 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Editorial help panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-xl">Get help fast</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><span className="text-foreground font-medium">Billing or account:</span> include the email tied to your account.</p>
                <p><span className="text-foreground font-medium">Bug report:</span> share steps to reproduce and your browser/OS.</p>
                <p><span className="text-foreground font-medium">Feature idea:</span> describe the job to be done and where it fits in your flow.</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-xl">Before you write</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Checked the <Link href="/#:~:text=learning%20feel%20easy.”-,FAQs,-How%20does%20SpeakUp" className="underline">FAQ</Link>?</li>
                  <li>Looked at <Link href="/about" className="underline">About</Link>?</li>
                  <li>On a deadline? Say “urgent” and include the session code.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right: Tall, clean form */}
          <div className="lg:col-span-7">
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl">Contact us</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
                  <div className="grid gap-2">
                    <label className="text-sm">Name</label>
                    <Input
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={onChange}
                      className="rounded-xl border-border"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm">Email</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={onChange}
                      className="rounded-xl border-border"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm">Topic</label>
                    <select
                      name="topic"
                      value={form.topic}
                      onChange={onChange}
                      className="rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/40"
                    >
                      <option value="general">General</option>
                      <option value="billing">Billing / account</option>
                      <option value="bug">Bug report</option>
                      <option value="feature">Feature request</option>
                      <option value="education">Education / classroom</option>
                      <option value="enterprise">Team / enterprise</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm">Message</label>
                    <textarea
                      name="message"
                      rows={7}
                      placeholder="How can we help?"
                      value={form.message}
                      onChange={onChange}
                      className="rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-foreground/40 resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      We’ll reply to {form.email || "your email"}.
                    </p>
                    <Button type="submit" className="rounded-xl px-6 bg-foreground text-background hover:opacity-90">
                      Send message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border text-xs">
        <div className="w-full px-6 md:px-10 xl:px-16 py-10 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-foreground/70">
            <Link href="/about" className="hover:text-foreground">About</Link>
          </nav>
          <p className="text-foreground/50">© {new Date().getFullYear()} SpeakUp</p>
        </div>
      </footer>
    </main>
  );
}
