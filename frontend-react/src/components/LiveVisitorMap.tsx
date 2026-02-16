import { useEffect, useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useLazyQuery } from '@apollo/client/react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'
import { Globe, Play, Pause, Filter, Clock, Smartphone, Monitor, Layers } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
                weight
                weight
                avgIntent
                referrer
                startedAt
                city
                country
                pagesVisited
                deviceType
                os
                browser
                duration
                org
            }
            geoStats {
                country
                count
            }
            cityStats {
                city
                country
                count
                lat
                lng
            }
             overview {
                totalSessions
            }
        }
    }
`

const GET_AREA_STATS = gql`
    query GetAreaStats($siteId: String!, $centerLat: Float!, $centerLng: Float!, $radiusKm: Float!, $days: Float!) {
        getAreaStats(siteId: $siteId, centerLat: $centerLat, centerLng: $centerLng, radiusKm: $radiusKm, days: $days) {
            visitorCount
            avgIntentScore
            topPages
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

  /* New State for Area Selection & Advanced Filters */
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectionCenter, setSelectionCenter] = useState<[number, number] | null>(null)
  const [selectionRadius, setSelectionRadius] = useState<number>(0) // meters
  const [areaStats, setAreaStats] = useState<any>(null)

  const [selectedReferrer, setSelectedReferrer] = useState<string>('All')
  const [selectedDevice, setSelectedDevice] = useState<string>('All')

  // Persistent Map Layer Preference
  const [mapLayer, setMapLayer] = useState<'Street' | 'Dark' | 'Satellite'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tracker_map_layer')
      return (saved as 'Street' | 'Dark' | 'Satellite') || 'Satellite'
    }
    return 'Satellite'
  })

  const [isTimeLapseMode, setIsTimeLapseMode] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeProgress, setTimeProgress] = useState(100) // 0 to 100% of the selected time range

  const [fetchAreaStats, { loading: areaLoading }] = useLazyQuery(GET_AREA_STATS)



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

  // Reset selection when time range changes
  useEffect(() => {
    setSelectionCenter(null)
    setSelectionRadius(0)
    setAreaStats(null)
    setIsDrawing(false)
    // Reset advanced filters
    setTimeProgress(100)
    setIsPlaying(false)
    refetch()
  }, [timeRange, refetch])

  // Time Lapse Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && isTimeLapseMode) {
      interval = setInterval(() => {
        setTimeProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 100
          }
          return prev + 1 // Increment by 1% per tick
        })
      }, 100) // 100ms * 100 steps = 10s duration for full range
    }
    return () => clearInterval(interval)
  }, [isPlaying, isTimeLapseMode])

  // Persist Map Layer Choice
  useEffect(() => {
    localStorage.setItem('tracker_map_layer', mapLayer)
  }, [mapLayer])

  // Map events hook component
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (!isDrawing) return

        if (!selectionCenter) {
          // First click: Set center
          setSelectionCenter([e.latlng.lat, e.latlng.lng])
          setSelectionRadius(0)
        } else {
          // Second click: Finish drawing and fetch stats
          const radiusMeters = e.latlng.distanceTo(selectionCenter)
          setSelectionRadius(radiusMeters)
          setIsDrawing(false)

          fetchAreaStats({
            variables: {
              siteId,
              centerLat: selectionCenter[0],
              centerLng: selectionCenter[1],
              radiusKm: radiusMeters / 1000,
              days: getDaysValue(timeRange)
            }
          }).then((res) => {
            if (res.data) setAreaStats((res.data as any).getAreaStats)
          })
        }
      },
      mousemove(e) {
        if (isDrawing && selectionCenter) {
          setSelectionRadius(e.latlng.distanceTo(selectionCenter))
        }
      }
    })
    return null
  }

  if (loading && !data) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (error) return <div className="p-8 text-destructive">Error: {error.message}</div>

  const rawHeatmapPoints = (data as any)?.getAnalyticsDashboard?.heatMapPoints || []

  // 1. Get Unique Filters
  const uniqueReferrers = Array.from(new Set(rawHeatmapPoints.map((p: any) => p.referrer || 'Direct')))
    .filter(Boolean).sort() as string[]

  const uniqueDevices = Array.from(new Set(rawHeatmapPoints.map((p: any) => p.deviceType || 'Unknown')))
    .filter(Boolean).sort() as string[]

  // 2. Apply Filters
  const heatmapPoints = rawHeatmapPoints.filter((pt: any) => {
    // Referrer Filter
    if (selectedReferrer !== 'All' && (pt.referrer || 'Direct') !== selectedReferrer) return false

    // Device Filter
    if (selectedDevice !== 'All' && (pt.deviceType || 'Unknown') !== selectedDevice) return false

    // Time Lapse Filter
    if (isTimeLapseMode) {
      if (!pt.startedAt) return true // Show if no time
      const ptTime = new Date(pt.startedAt).getTime()
      const now = Date.now()
      const days = getDaysValue(timeRange)
      const startTime = now - (days * 24 * 60 * 60 * 1000)
      const currentCutoff = startTime + ((now - startTime) * (timeProgress / 100))

      return ptTime <= currentCutoff
    }
    return true
  })

  // Calculate actual displayed count
  const displayedVisitors = heatmapPoints.length

  const countryCounts = (data as any)?.getAnalyticsDashboard?.geoStats || []
  const cityStats = (data as any)?.getAnalyticsDashboard?.cityStats || []
  /* Removed totalVisitors to rely on displayedVisitors */

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
              <span className="font-semibold text-foreground">{displayedVisitors}</span> visitors in the last {timeRange === '1h' ? 'hour' : timeRange}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Referrer Filter */}
            <div className="flex items-center space-x-2 bg-background border px-2 py-1.5 rounded-md shadow-sm">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <select
                className="bg-transparent text-xs outline-none cursor-pointer max-w-[80px]"
                value={selectedReferrer}
                onChange={(e) => setSelectedReferrer(e.target.value)}
              >
                <option value="All">All Sources</option>
                {uniqueReferrers.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Device Filter */}
            <div className="flex items-center space-x-2 bg-background border px-2 py-1.5 rounded-md shadow-sm">
              {selectedDevice === 'Mobile' ? <Smartphone className="w-3 h-3 text-muted-foreground" /> : <Monitor className="w-3 h-3 text-muted-foreground" />}
              <select
                className="bg-transparent text-xs outline-none cursor-pointer max-w-[80px]"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="All">All Devices</option>
                {uniqueDevices.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Map Layer Toggle */}
            <button
              onClick={() => setMapLayer(prev => prev === 'Street' ? 'Dark' : prev === 'Dark' ? 'Satellite' : 'Street')}
              className="p-2 rounded-md bg-card hover:bg-muted border shadow-sm text-xs font-medium flex items-center gap-1"
              title="Switch Map Style"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">{mapLayer}</span>
            </button>

            {/* Time Lapse Toggle */}
            <button
              onClick={() => {
                const newMode = !isTimeLapseMode
                setIsTimeLapseMode(newMode)
                if (newMode) setTimeProgress(0) // Start from beginning
                else setTimeProgress(100)
                setIsPlaying(false)
              }}
              className={cn(
                "p-2 rounded-md transition-colors border shadow-sm",
                isTimeLapseMode ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted text-muted-foreground"
              )}
              title="Time Lapse Replay"
            >
              <Clock className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsDrawing(!isDrawing)
                if (!isDrawing) {
                  setSelectionCenter(null)
                  setSelectionRadius(0)
                  setAreaStats(null)
                }
              }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors border shadow-sm",
                isDrawing ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
              )}
            >
              {isDrawing ? "Finish" : "Draw"}
            </button>

            <div className="hidden sm:flex items-center space-x-2 bg-background/50 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-sm font-semibold">
                {(countData as any)?.getLiveVisitorCount || 0} live
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

        {isTimeLapseMode && (
          <div className="absolute top-20 left-6 right-6 z-20 bg-background/90 backdrop-blur border rounded-lg p-3 shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => {
                if (timeProgress >= 100) setTimeProgress(0)
                setIsPlaying(!isPlaying)
              }}
              className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={timeProgress}
                onChange={(e) => {
                  setTimeProgress(Number(e.target.value))
                  setIsPlaying(false)
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                <span>Past</span>
                <span>Present</span>
              </div>
            </div>
            <div className="text-sm font-mono w-16 text-right">
              {Math.round(timeProgress)}%
            </div>
          </div>
        )}

        <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-inner relative z-0">
          {typeof window !== 'undefined' && (
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: 'transparent' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={
                  mapLayer === 'Dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" :
                    mapLayer === 'Satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" :
                      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />
              <MapEvents />
              {selectionCenter && selectionRadius > 0 && (
                <Circle
                  center={selectionCenter}
                  radius={selectionRadius}
                  pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.2 }}
                />
              )}

              {selectionCenter && !isDrawing && (
                <Popup position={selectionCenter}>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2">Area Analysis</h3>
                    {areaLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    ) : areaStats ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Visitors:</span>
                          <span className="font-bold">{areaStats.visitorCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Intent:</span>
                          <span className={cn(
                            "font-bold",
                            areaStats.avgIntentScore > 70 ? "text-red-500" :
                              areaStats.avgIntentScore > 40 ? "text-orange-500" : "text-blue-500"
                          )}>{Math.round(areaStats.avgIntentScore)}</span>
                        </div>
                        {areaStats.topPages.length > 0 && (
                          <div className="mt-2 border-t pt-2">
                            <p className="font-semibold mb-1">Top Pages:</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                              {areaStats.topPages.map((p: string, i: number) => (
                                <li key={i} className="truncate max-w-[180px]">{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data found in this area.</p>
                    )}
                  </div>
                </Popup>
              )}

              {heatmapPoints.map((pt: any, i: number) => {
                // Dynamic coloring based on INTENT
                let color = '#3b82f6'; // Blue (Bouncer)
                let label = 'Bouncer';

                // avgIntent comes from backend
                // Backend rules: < 30 Bouncer, 30-70 Researcher, > 70 Lead
                if (pt.avgIntent > 70) {
                  color = '#ef4444'; // Red (Lead)
                  label = 'Lead';
                } else if (pt.avgIntent >= 30) {
                  color = '#f97316'; // Orange (Researcher)
                  label = 'Researcher';
                }

                return (
                  <CircleMarker
                    key={i}
                    center={[pt.lat, pt.lng]}
                    radius={3} // Small, fixed radius for individual points
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.8,
                      weight: 0,
                    }}
                  >
                    <Popup minWidth={300}>
                      <div className="text-black p-1">
                        <Tabs defaultValue="profile" className="w-full">
                          <TabsList className="w-full grid grid-cols-3 h-8 bg-muted/50">
                            <TabsTrigger value="profile" className="text-xs h-6">Profile</TabsTrigger>
                            <TabsTrigger value="journey" className="text-xs h-6">Journey</TabsTrigger>
                            <TabsTrigger value="intent" className="text-xs h-6">Intent</TabsTrigger>
                          </TabsList>
                          <TabsContent value="profile" className="space-y-2 mt-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">👤</div>
                              <div>
                                <div className="font-bold text-sm">{pt.city || 'Unknown'}, {pt.country || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">{pt.org || 'Anonymous Org'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2 bg-slate-50 p-2 rounded">
                              <div><span className="font-semibold">Device:</span> {pt.deviceType || 'Unknown'}</div>
                              <div><span className="font-semibold">Browser:</span> {pt.browser || 'Unknown'}</div>
                              <div><span className="font-semibold">OS:</span> {pt.os || 'Unknown'}</div>
                              <div><span className="font-semibold">Source:</span> {pt.referrer || 'Direct'}</div>
                            </div>
                          </TabsContent>
                          <TabsContent value="journey" className="space-y-2 mt-2">
                            <div className="text-xs">
                              <div className="flex justify-between mb-1">
                                <span className="font-semibold">Duration:</span>
                                <span>{pt.duration ? Math.round(pt.duration) + 's' : 'Active'}</span>
                              </div>
                              <div className="font-semibold mb-1">Pages Visited:</div>
                              <ul className="list-disc list-inside max-h-24 overflow-y-auto text-muted-foreground bg-slate-50 p-2 rounded border">
                                {(pt.pagesVisited || []).map((page: string, i: number) => (
                                  <li key={i} className="truncate">{page}</li>
                                ))}
                              </ul>
                            </div>
                          </TabsContent>
                          <TabsContent value="intent" className="space-y-2 mt-2 text-center">
                            <div className="text-sm font-semibold mb-2" style={{ color: color }}>Condition: {label}</div>
                            <div className="text-3xl font-bold" style={{ color }}>{Math.round(pt.avgIntent || 0)}</div>
                            <div className="text-xs text-muted-foreground">Intent Score</div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {pt.avgIntent > 70 ? "This user is showing strong purchase intent." :
                                pt.avgIntent > 30 ? "This user is researching." :
                                  "This user is just browsing."}
                            </div>
                          </TabsContent>
                        </Tabs>
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
            <span className="text-muted-foreground">Bouncer (&lt;30)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">Researcher (30-70)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Lead (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* City Wise Data Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">City Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cityStats.slice(0, 6).map((city: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {city.country.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{city.city}</p>
                    <p className="text-xs text-muted-foreground">{city.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{city.count}</p>
                  <p className="text-xs text-muted-foreground">Visitors</p>
                </div>
              </div>
            ))}
            {cityStats.length === 0 && (
              <div className="col-span-full text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                No city-level data available.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Top Countries</h3>
          <div className="space-y-3">
            {countryCounts.slice(0, 5).map((country: any, idx: number) => (
              <div key={idx} className="p-3 bg-card rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium truncate text-sm">{country.country || 'Unknown'}</p>
                  <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${(country.count / (countryCounts[0]?.count || 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{country.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
