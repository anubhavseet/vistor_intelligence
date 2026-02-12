import { useEffect, useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'

const GET_LIVE_VISITOR_COUNT = gql`
  query GetLiveVisitorCount($siteId: String!) {
    getLiveVisitorCount(siteId: $siteId)
  }
`

const GET_MAP_DATA = gql`
    query GetAnalyticsMap($siteId: String!, $days: Float!) {
        getAnalyticsDashboard(siteId: $siteId, days: $days) {
            heatMapPoints {
                lat
                lng
                weight
                avgIntent
            }
            geoStats {
                country
                count
            }
             overview {
                totalSessions
            }
        }
    }
`

interface LiveVisitorMapProps {
  siteId: string
}

export default function LiveVisitorMap({ siteId }: LiveVisitorMapProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Map timeRange string to days float for backend
  const getDaysValue = (range: string) => {
    switch (range) {
      case '1h': return 0.04;
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      default: return 1;
    }
  }

  const { data: countData } = useQuery(GET_LIVE_VISITOR_COUNT, {
    variables: { siteId },
    pollInterval: 10000,
  })

  const { data, loading, error, refetch } = useQuery(GET_MAP_DATA, {
    variables: {
      siteId,
      days: getDaysValue(timeRange),
    },
    pollInterval: 30000,
  })

  useEffect(() => {
    refetch()
  }, [timeRange, refetch])

  if (loading && !data) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (error) return <div className="p-8 text-destructive">Error: {error.message}</div>

  const heatmapPoints = (data as any)?.getAnalyticsDashboard?.heatMapPoints || []
  const countryCounts = (data as any)?.getAnalyticsDashboard?.geoStats || []
  const totalVisitors = (data as any)?.getAnalyticsDashboard?.overview?.totalSessions || 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-card rounded-xl border shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 z-10 relative">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Live Visitor Map
            </h2>
            <p className="text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{totalVisitors}</span> visitors in the last {timeRange === '1h' ? 'hour' : timeRange}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-background/50 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-sm font-semibold">
                {(countData as any)?.getLiveVisitorCount || 0} live now
              </span>
            </div>

            <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg border">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    timeRange === range
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-inner relative z-0">
          {typeof window !== 'undefined' && (
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: 'transparent' }}>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              />
              {heatmapPoints.map((pt: any, i: number) => {
                // Dynamic coloring based on INTENT
                let color = '#3b82f6'; // Blue (Low Intent)
                let label = 'Casual';

                // avgIntent comes from backend
                if (pt.avgIntent > 70) {
                  color = '#ef4444'; // Red (High Intent)
                  label = 'High Intent';
                } else if (pt.avgIntent > 40) {
                  color = '#f97316'; // Orange (Medium Intent)
                  label = 'Researcher';
                }

                return (
                  <CircleMarker
                    key={i}
                    center={[pt.lat, pt.lng]}
                    radius={Math.min(pt.weight * 3, 25)}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.6,
                      weight: 1,
                      opacity: 0.8
                    }}
                  >
                    <Popup>
                      <div className="text-black">
                        <div className="font-bold">{pt.weight} Visitors</div>
                        <div className="text-xs font-semibold" style={{ color: color }}>Condition: {label}</div>
                        <div className="text-xs">Avg Score: {Math.round(pt.avgIntent || 0)}</div>
                        <div className="text-xs text-gray-500 mt-1">{pt.lat.toFixed(2)}, {pt.lng.toFixed(2)}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 px-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Casual (&lt;40)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">Researcher (40-70)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">High Intent (&gt;70)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {countryCounts.slice(0, 8).map((country: any, idx: number) => (
          <div key={idx} className="p-4 bg-card rounded-lg border shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium truncate">{country.country || 'Unknown'}</p>
              <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{country.count.toLocaleString()}</p>
            <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${(country.count / (countryCounts[0]?.count || 1)) * 100}%` }}></div>
            </div>
          </div>
        ))}
        {countryCounts.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
            No geographic data available for this period.
          </div>
        )}
      </div>
    </div>
  )
}
