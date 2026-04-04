import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function QCTrendsDashboard() {
  const { t } = useLanguage();
  const { data: trends, isLoading } = trpc.qualityTests.getTrends.useQuery({ days: 30 });
  const { data: failedTests } = trpc.qualityTests.getFailedTests.useQuery({ days: 7 });

  if (isLoading) {
    return <div className="text-white">Loading trends...</div>;
  }

  if (!trends) {
    return null;
  }

  const statusData = [
    { name: 'Pass / Prošao', value: trends.passRate, color: '#22c55e' },
    { name: 'Fail / Pao', value: trends.failRate, color: '#ef4444' },
    { name: 'Pending / Na čekanju', value: trends.pendingRate, color: '#eab308' },
  ];

  const testTypeData = trends.byType.map(item => ({
    name: item.type.replace('_', ' ').toUpperCase(),
    count: item.total,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/90 backdrop-blur border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{trends.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fail Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{trends.failRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{trends.pendingRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{trends.totalTests}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Status Distribution */}
        <Card className="bg-card/90 backdrop-blur border-orange-500/20">
          <CardHeader>
            <CardTitle>Test Status Distribution / Distribucija statusa testova</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tests by Type */}
        <Card className="bg-card/90 backdrop-blur border-orange-500/20">
          <CardHeader>
            <CardTitle>Tests by Type / Testovi po tipu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FF6C0E' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#FF6C0E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failed Tests Alert */}
      {failedTests && failedTests.length > 0 && (
        <Card className="bg-red-500/10 backdrop-blur border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Recent Failed Tests (Last 7 Days) / Nedavno pali testovi (poslednjih 7 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedTests.slice(0, 5).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-card/50 rounded border border-red-500/20">
                  <div>
                    <div className="font-medium text-white">{test.testName}</div>
                    <div className="text-sm text-muted-foreground">
                      {test.testType} • {test.result} {test.unit}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
