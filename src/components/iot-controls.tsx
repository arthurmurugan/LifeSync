'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Lightbulb, Thermometer, Camera, Lock, Volume2, Tv } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'camera' | 'lock' | 'speaker' | 'tv';
  isOnline: boolean;
  isOn: boolean;
  value?: number;
  room: string;
}

const deviceIcons = {
  light: Lightbulb,
  thermostat: Thermometer,
  camera: Camera,
  lock: Lock,
  speaker: Volume2,
  tv: Tv,
};

export default function IoTControls() {
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'Living Room Light', type: 'light', isOnline: true, isOn: true, value: 75, room: 'Living Room' },
    { id: '2', name: 'Main Thermostat', type: 'thermostat', isOnline: true, isOn: true, value: 72, room: 'Main Floor' },
    { id: '3', name: 'Front Door Camera', type: 'camera', isOnline: true, isOn: true, room: 'Entrance' },
    { id: '4', name: 'Smart Lock', type: 'lock', isOnline: false, isOn: false, room: 'Front Door' },
    { id: '5', name: 'Kitchen Speaker', type: 'speaker', isOnline: true, isOn: false, value: 50, room: 'Kitchen' },
    { id: '6', name: 'Bedroom TV', type: 'tv', isOnline: true, isOn: false, room: 'Master Bedroom' },
  ]);

  const toggleDevice = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, isOn: !device.isOn }
        : device
    ));
  };

  const updateDeviceValue = (deviceId: string, value: number) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, value }
        : device
    ));
  };

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const activeDevices = devices.filter(d => d.isOnline && d.isOn).length;

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">IoT Device Controls</h1>
          <p className="text-muted-foreground">
            Manage your smart home devices through Cisco Packet Tracer simulation
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{onlineDevices}</div>
                  <div className="text-sm text-muted-foreground">Devices Online</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{activeDevices}</div>
                  <div className="text-sm text-muted-foreground">Active Devices</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{devices.length - onlineDevices}</div>
                  <div className="text-sm text-muted-foreground">Offline Devices</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const IconComponent = deviceIcons[device.type];
            return (
              <Card key={device.id} className={`${!device.isOnline ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${device.isOn && device.isOnline ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <IconComponent className={`h-5 w-5 ${device.isOn && device.isOnline ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription className="text-sm">{device.room}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={device.isOnline ? 'default' : 'secondary'}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Power</span>
                    <Switch
                      checked={device.isOn}
                      onCheckedChange={() => toggleDevice(device.id)}
                      disabled={!device.isOnline}
                    />
                  </div>
                  
                  {device.value !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {device.type === 'light' ? 'Brightness' : 
                           device.type === 'thermostat' ? 'Temperature' : 
                           device.type === 'speaker' ? 'Volume' : 'Level'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {device.value}{device.type === 'thermostat' ? '°F' : '%'}
                        </span>
                      </div>
                      <Slider
                        value={[device.value]}
                        onValueChange={(value) => updateDeviceValue(device.id, value[0])}
                        max={device.type === 'thermostat' ? 85 : 100}
                        min={device.type === 'thermostat' ? 60 : 0}
                        step={1}
                        disabled={!device.isOnline || !device.isOn}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {device.type === 'camera' && device.isOnline && (
                    <Button variant="outline" size="sm" className="w-full">
                      View Live Feed
                    </Button>
                  )}
                  
                  {device.type === 'lock' && device.isOnline && (
                    <Button 
                      variant={device.isOn ? "destructive" : "default"} 
                      size="sm" 
                      className="w-full"
                      onClick={() => toggleDevice(device.id)}
                    >
                      {device.isOn ? 'Unlock' : 'Lock'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Simulation Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Wifi className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Cisco Packet Tracer Integration</h3>
                <p className="text-sm text-blue-700 mt-1">
                  These devices are simulated through Cisco Packet Tracer. In a real implementation, 
                  these controls would communicate with actual IoT devices in your network topology.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}