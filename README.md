# MARS Rover

This library provides a Microsoft Makecode extension for the [4tronix M.A.R.S. Rover](https://shop.4tronix.co.uk/products/marsrover)

Here are [the assembly instructions](https://4tronix.co.uk/rover)

## Driving the MARS Rover
The simplest way to drive Rover is by using the `marsRover.move(...)` and `marsRover.moveMilli(...)` blocks.
The speed is between 0 (stop) and 100 (full speed)
Direction can be Forward or Reverse

Drive forward at speed 60:

```block
marsRover.move(RVvector.Forward, 60)
```

Drive backwards at speed 70 for 2 seconds:

```block
marsRover.moveMilli(RVvector.Reverse, 70, 2000)
```   

You can also spin on the spot - either left or right
 
Spin left at speed 60:

```block
marsRover.spin(RVdirection.Left, 60)
```

Spin right at speed 50:

```block
marsRover.spin(RVdirection.Right, 50)
```

If you want more fine grain control of individal motors, use `marsRover.motor(..)` to drive motor either forward or reverse. The value
indicates speed and is between 0 (stop) and 100 (full speed).
Direction can be Forward or Reverse

Drive left motors forward at speed 60 (right motors are unchanged):

```block
marsRover.motor(RVmotor.Left, RVvector.Forward, 60)
```

Drive both motors in reverse at speed 50:

```block
marsRover.motor(RVmotor.Both, RVvector.Reverse, 50)
```

## Controlling the Servos

To turn an individual servo to a position from -90 to +90 degrees, use the `setServo(..)` command.

Turn the Mast servo (servo 0) to 30 degrees:

```block
marsRover.setServo(0, 30)
```

You can also select the name of the servo using the `servoNumber(..)` function.

```block
marsRover.servoNumber(RVservos.Mast)
```

To steer left, the front wheel servos need to point left and the rear servos to point right. You could do this individually, but the `marsRover.steer(..)` block is designed for this:

Turn the wheels to an angle of 30 degrees left. Motor speeds are not affected.

```block
marsRover.steer(RVdirection.Left, 30)
```

Turn the wheels to an angle of 45 degrees right - a rather excessive turn!

```block
marsRover.steer(RVdirection.Right, 45)
```

To point straight ahead, you can either steer with an angle of zero, or simply centre the wheel servos using `marsRover.zeroServos(...)`. You can select all servos, just the wheel servos, or just the mast servos:

```blocks
marsRover.zeroServos(RVservoGroup.Wheel)
marsRover.zeroServos(RVservoGroup.Mast)
marsRover.zeroServos(RVservoGroup.All)
```

The MARS Rover has an EEROM that stores an offset for each servo to ensure that it points straight ahead when set to its zero position. You should run the CalibrateServos program to set these up for your robot after you first assemble it.
The servo offsets are stored in the Microbit memory when the Rover is started up. In the servo blocks you can set and clear the values in these offsets, but they will be lost when the Rover is switched off. You will need to use the commands in the EEROM blocks to save the values permanently.

To clear all the offsets in memory:

```block
marsRover.clearOffsets()
```

To set an individual servo offset to 8. Value can be from -128 to +127 bit is normally between -20 and +20:

```block
marsRover.setOffset(Rover.getServoNumber(RVservos.FrontLeft), 8)
```

## Managing the EEROM

The EEROM on board the Rover stores the offsets for each servo to ensure that they are zero. However, there is plenty of room left, so it has been made acessible. You could store movement sequences, plan your daily journey, etc.
Each data value is an 8-bit integer, so it can have a value from -128 to +127. The EEROM is 1024 bytes, but the first 16 are used only for the servo offsets, so 1008 bytes are available for the user


To read a byte value from location 12 (in reality this is location 28):

```block
marsRover.readEEROM(12)
```

To write a value of 49 to location 12:

```block
Rover.writeEEROM(49, 12)
```

There are also blocks to manage the saving and loading of the servo offsets. These are treated as a single block of data, so all offsets are loaded or saved at the same time. You can use these functions to save the servo offsets permanently even after a power off

Load all the stored offsets from EEROM into memory:

```block
marsRover.loadOffsets()
```

Save all the offsets from memory into the EEROM:

```block
marsRover.saveOffsets()
```

## Read sonar value

If you have mounted the optional sonar sensor for the Robobit you can
also use the `marsRover.readSonar(..)` function to read the distance to obstacles.

```block
marsRover.readSonar(RVpingUnit.Centimeters)
```

## FireLed Functions

The MARS Rover has 4 FireLeds, one in each corner. There is a set of commands to control them

Set all FireLeds to Green (hard-coded RGB color):

```block
marsRover.setLedColor(0x00FF00)
```

Set all FireLeds to Green (built-in colour selection):

```block
marsRover.setLedColor(RVcolors.Green)
```

Clear all LEDs:

```block
marsRover.ledClear()
```

Set LED at position 2 (0 to 3) to Green:

```block
marsRover.setPixelColor(2, marsRover.RVcolours(RVcolors.Green))
```

Set LEDs to a rainbow selection:

```block
marsRover.ledRainbow()
```

Set brightness of LEDs to 40 (0 to 255):

```block
marsRover.ledBrightness(40)
```

## Supported targets

* for PXT/microbit

## License

MIT
