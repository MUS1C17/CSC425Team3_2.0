import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Header*/}
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

        {/* Hero */}
        <section className="w-full flex justify-center">
          <div className="max-w-5xl w-full px-5 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Ask Anonymously.<br />Learn Loudly.
                </h1>
                <p className="text-muted-foreground max-w-prose">
                  Get clear answers to real questions—without revealing your
                  identity. SpeakUp makes it easy to ask, learn, and grow in a
                  safe, welcoming space.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/auth/signup">
                    <Button 
                      variant="outline"
                      className="rounded-xl px-5 py-5 border-border text-foreground">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      variant="outline"
                      className="rounded-xl px-5 py-5 border-border text-foreground">
                      See how it works
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right-side mock frame*/}
              <div className="rounded-2xl border border-foreground/10 p-6">
                <div className="rounded-xl border border-foreground/20 p-4">
                  <div className="flex gap-2 pb-4">
                    <span className="h-3 w-3 rounded-full bg-foreground" />
                    <span className="h-3 w-3 rounded-full bg-foreground" />
                    <span className="h-3 w-3 rounded-full bg-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 border bg-foreground rounded" />
                    <div className="h-4 w-2/3 border bg-foreground rounded" />
                    <div className="h-24 w-full border bg-foreground rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features*/}
        <section className="w-full flex justify-center border-t border-border">
          <div className="max-w-5xl w-full px-5 py-16 grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card/60 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Ask Anonymously</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Post questions without revealing who you are. Share freely and focus on learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Gain Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Learn from peers and mentors. Get thoughtful answers and clear, practical explanations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Stay Private</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Your identity stays protected. Ask the hard questions with confidence.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* Quote */}
        <section className="w-full flex justify-center">
          <div className="max-w-5xl w-full px-5 py-12">
            <div className="rounded-2xl border border-foreground/10 p-8">
              <blockquote className="text-xl leading-relaxed">
                “I finally asked what I was afraid to ask in class—and got a
                clear answer. SpeakUp makes learning feel easy.”
              </blockquote>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full flex justify-center border-t border-foreground/10">
          <div className="max-w-5xl w-full px-5 py-16 grid md:grid-cols-2 gap-8">
            <h3 className="text-2xl font-bold md:col-span-2">FAQs</h3>
            <div className="space-y-4">
              <details className="group rounded-xl border border-foreground/10 p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span>How does SpeakUp work?</span>
                  <span className="text-foreground/50 group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-foreground/80">
                  Create an account, join a group, and ask questions anonymously.
                  Others reply, you learn—simple.
                </p>
              </details>

              <details className="group rounded-xl border border-foreground/10 p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span>Is it really anonymous?</span>
                  <span className="text-foreground/50 group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-foreground/80">
                  Yes! Questions are posted without your identity attached to the
                  thread.
                </p>
              </details>

              <details className="group rounded-xl border border-foreground/10 p-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span>Does it cost anything?</span>
                  <span className="text-foreground/50 group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-foreground/80">
                  Nope, it's totally free!
                </p>
              </details>
            </div>

            <div className="rounded-2xl border border-foreground/10 p-6 ">
              <h4 className="font-bold mb-3">Ready to try it?</h4>
              <p className="text-sm text-foreground/80 mb-5">
                Join in and ask your first anonymous question in seconds.
              </p>
              <div className="flex gap-3">
                <Link href="/auth/sign-up">
                  <Button 
                    variant="outline"
                    className="rounded-xl px-5 bg-background text-foreground">
                    Create account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="rounded-xl px-5 bg-background text-foreground">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-border text-xs">
          <div className="w-full px-6 md:px-10 xl:px-16 py-10 flex items-center justify-between">
            <nav className="flex items-center gap-6 text-foreground/70">
              <Link href="/about" className="hover:text-foreground">About</Link>
              <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
            </nav>
            <p className="text-foreground/50">© {new Date().getFullYear()} SpeakUp</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
