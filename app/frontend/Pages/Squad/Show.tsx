// app/frontend/Pages/Squad/Show.tsx
import React from 'react'
import { PageProps, Squad, Player } from '@/types'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SquadShowProps extends PageProps {
  squad: Squad
  available_players: Player[]
}

export default function Show({ squad, available_players }: SquadShowProps) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-3xl">My Squad</CardTitle>
                  <CardDescription>
                    Gameweek 15 • Formation: 4-4-2
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Budget Remaining
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    £{squad.budget.toFixed(1)}m
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Squad Tabs */}
          <Tabs defaultValue="pitch" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pitch">Pitch View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="pitch" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  {/* Football Pitch */}
                  <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-lg p-8">
                    <div className="grid grid-cols-4 gap-4">
                      {squad.players.slice(0, 11).map((player) => (
                        <div key={player.id} className="flex flex-col items-center">
                          <Avatar className="h-16 w-16 border-2 border-white">
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <Badge variant="secondary" className="mt-2">
                            {player.name}
                          </Badge>
                          <p className="text-white text-xs mt-1">
                            {player.points} pts
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bench */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Bench</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {squad.players.slice(11, 15).map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {player.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {player.points} pts
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full mt-6" size="lg">
                    Save Squad
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {squad.players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          <Avatar>
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {player.team_name} • {player.position}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            £{player.price}m
                          </Badge>
                          <Badge>{player.points} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Available Players */}
          <Card>
            <CardHeader>
              <CardTitle>Available Players</CardTitle>
              <CardDescription>
                Browse and add players to your squad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {available_players.slice(0, 6).map((player) => (
                  <Card key={player.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.team_name}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              £{player.price}m
                            </Badge>
                            <Badge variant="secondary">
                              {player.points} pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-3" size="sm">
                        Add to Squad
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}