import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Legal = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            Legal
          </h1>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" id="terms" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Terms of Service</h2>
                  <p className="text-muted-foreground mb-4">
                    Last updated: January 2024
                  </p>
                  
                  <h3 className="text-lg font-medium mt-6 mb-3">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing and using AI Benchmark, you accept and agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our service.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">2. Service Description</h3>
                  <p className="text-muted-foreground">
                    AI Benchmark provides AI-generated market benchmark reports based on user-provided inputs. 
                    Reports are delivered as PDF documents for a one-time fee.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">3. Payment & Refunds</h3>
                  <p className="text-muted-foreground">
                    Payment is required before report generation. We offer a 24-hour refund policy 
                    if the report does not meet reasonable expectations. Contact support for refund requests.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">4. User Responsibilities</h3>
                  <p className="text-muted-foreground">
                    Users are responsible for the accuracy of information provided. 
                    Reports are generated based on user inputs and should not be used as sole decision-making tools.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">5. Intellectual Property</h3>
                  <p className="text-muted-foreground">
                    Generated reports are for the user's personal or business use. 
                    Users may share reports with their teams and stakeholders. 
                    Reselling or redistributing reports is prohibited.
                  </p>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="privacy" id="privacy" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    Last updated: January 2024
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Information We Collect</h3>
                  <p className="text-muted-foreground">
                    We collect information you provide directly: email address, business details for reports, 
                    and payment information (processed securely by Stripe).
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">How We Use Your Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>To generate your benchmark reports</li>
                    <li>To process payments and send receipts</li>
                    <li>To deliver reports via email and dashboard</li>
                    <li>To improve our service and AI models</li>
                  </ul>

                  <h3 className="text-lg font-medium mt-6 mb-3">Data Retention</h3>
                  <p className="text-muted-foreground">
                    Report data is retained for as long as your account is active. 
                    You may request deletion of your data at any time by contacting support.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Third-Party Services</h3>
                  <p className="text-muted-foreground">
                    We use Stripe for payment processing and may use AI services for report generation. 
                    These services have their own privacy policies.
                  </p>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="disclaimer" id="disclaimer" className="prose prose-sm max-w-none">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-4">Disclaimer</h2>
                  <p className="text-muted-foreground mb-4">
                    Last updated: January 2024
                  </p>

                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
                    <p className="text-foreground font-medium mb-2">Important Notice</p>
                    <p className="text-muted-foreground text-sm">
                      AI Benchmark reports are decision-support tools, not official market research, 
                      legal advice, or financial advice.
                    </p>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-3">Nature of Reports</h3>
                  <p className="text-muted-foreground">
                    Reports are generated using AI based on user-provided inputs and general market patterns. 
                    They are designed to provide strategic guidance and should be used alongside other research.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Accuracy & Sources</h3>
                  <p className="text-muted-foreground">
                    We strive for accuracy but cannot guarantee all information is current or complete. 
                    If you provide competitor URLs, we cite them. We never invent sources. 
                    Market conditions change — validate recommendations before critical decisions.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">User Responsibility</h3>
                  <p className="text-muted-foreground">
                    Users should validate pricing, regulatory requirements, and assumptions specific to their situation. 
                    Consult qualified professionals for legal, financial, or compliance decisions.
                  </p>

                  <h3 className="text-lg font-medium mt-6 mb-3">Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    AI Benchmark is not liable for business decisions made based on report recommendations. 
                    Maximum liability is limited to the purchase price of the report.
                  </p>
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Legal;
