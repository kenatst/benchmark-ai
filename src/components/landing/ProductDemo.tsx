import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'action-plan', label: 'Action Plan' }
];

export const ProductDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section id="use-cases" className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See what's inside the report
          </h2>
          <p className="text-muted-foreground">
            A polished, structured document designed for clarity and action.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              <TabsContent value="overview" className="m-0">
                <div className="p-8 space-y-6">
                  <div className="text-center mb-8">
                    <div className="h-6 bg-foreground/10 rounded w-2/3 mx-auto mb-4" />
                    <div className="h-3 bg-foreground/5 rounded w-1/2 mx-auto" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-primary/20 rounded w-3/4" />
                      <div className="h-3 bg-foreground/5 rounded w-full" />
                      <div className="h-3 bg-foreground/5 rounded w-5/6" />
                      <div className="h-3 bg-foreground/5 rounded w-4/5" />
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-primary/40 text-sm">Market Overview</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    <div className="h-4 bg-foreground/10 rounded w-1/3 mb-4" />
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-3 bg-primary/10 rounded flex-1" />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="competitors" className="m-0">
                <div className="p-8">
                  <div className="h-5 bg-foreground/10 rounded w-1/3 mb-6" />
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">
                            <div className="h-3 bg-foreground/10 rounded w-20" />
                          </th>
                          <th className="text-left py-3 px-4">
                            <div className="h-3 bg-foreground/10 rounded w-16" />
                          </th>
                          <th className="text-left py-3 px-4">
                            <div className="h-3 bg-foreground/10 rounded w-16" />
                          </th>
                          <th className="text-left py-3 px-4">
                            <div className="h-3 bg-foreground/10 rounded w-14" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((row) => (
                          <tr key={row} className="border-b border-border/50">
                            <td className="py-4 px-4">
                              <div className="h-3 bg-primary/20 rounded w-24" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-3 bg-foreground/5 rounded w-full" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-3 bg-foreground/5 rounded w-full" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-3 bg-foreground/5 rounded w-16" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="action-plan" className="m-0">
                <div className="p-8">
                  <div className="h-5 bg-foreground/10 rounded w-1/3 mb-6" />
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {['30 Days', '60 Days', '90 Days'].map((period, index) => (
                      <div key={period} className="bg-background rounded-lg p-4 border border-border">
                        <div className="text-primary font-semibold text-sm mb-4">{period}</div>
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-primary/30" />
                              <div 
                                className="h-2 bg-foreground/5 rounded flex-1"
                                style={{ width: `${60 + Math.random() * 40}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
