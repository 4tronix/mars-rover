# MARS Rover

This library provides a Microsoft Makecode extension for the [4tronix M.A.R.S. Rover](https://shop.4tronix.co.uk/products/marsrover)

## Driving the MARS Rover
The simplest way to drive Rover is by using the `move_Milli(...)` and move(...)` blocks.
The speed is between 0 (stop) and 100 (full speed)
Direction can be Forward or Reverse

Drive forward at speed 60:

```block
Rover.move(eVector.Forward, 60)
```

Drive backwards at speed 70 for 2 seconds:

```block
Rover.move_milli(eVector.Reverse, 70, 2000)
```   

You can also spin on the spot - either left or right
 
Spin left at speed 60:

```block
Rover.spin(eDirection.Left, 60)
```

Spin right at speed 50:

```block
Rover.spin(eDirection.Right, 50)
```

If you want more fine grain control of individal motors, use `Rover.motor(..)` to drive motor either forward or reverse. The value
indicates speed and is between 0 (stop) and 100 (reverse.

Drive left motors forward at speed 60 (right motors are unchanged):

```block
Rover.motor(eMotor.Left, eVector.Forward, 60)
```

Drive both motors in reverse at speed 50:

```block
Rover.motor(eMotor.Both, eVector.Reverse, 50)
```

## Controlling the Servos

To turn an individual servo to a position from -90 to +90 degrees, use the setServo(..) command.

Turn the Mast servo (servo 0) to 30 degrees:

```block
Rover.setServo(0, 30)
```

You can also select the name of the servo using the getServoNumber(..) function. This command does the same as the one above:

```block
Rover.getServoNumber(eServos.Mast)
```

To steer left, the front wheel servos need to point left and the rear servos to point right. You could do this  individually, but the Rover.steer(..) is designed for this:

Turn the wheels to an angle of 30 degrees left. Motors are not affected.
```block
Rover.steer(eDirection.Left, 30)
```

Turn the wheels to an angle of 45 degrees right - Rather excessive turn!

```block
Rover.steer(eDirection.Right, 45)
```

To point straight ahead, you can either steer with an angle of zero, or simply centre the wheel servos using `Rover.zeroServos(...)`. You can select all servos, just the wheel servos, or just the mast servos:

```blocks
Rover.zeroServos(eServoGroup.Wheel)
Rover.zeroServos(eServoGroup.Mast)
Rover.zeroServos(eServoGroup.All)
```

The MARS Rover has an EEROM that stores an offset for each servo to ensure that it points straight ahead when set to its zero position. You should run the CalibrateServos program to set these up for your robot after you first assemble it.
The servo offsets are stored in the Microbit memory when the Rover is started up. In the servo blocks you can set and clear the values in these offsets, but they will be lost when the Rover is switched off. You will need to use the commands in the EEROM blocks to save the values permanently.

To clear all the offsets in memory:

```block
Rover.clearOffsets()
```

To set an individual servo offset to 8. Value can be from -128 to +127 bit is normally between -20 and +20:

```block
Rover.setOffset(Rover.getServoNumber(eServos.FL), 8)
```

## Managing the EEROM

The EEROM on board the Rover stores the offsets for each servo to ensure that they are zero. However, there is plenty of room left, so it has been made acessible. You could store movement sequences, plan your daily journey, etc.
Each data value is an 8-bit integer, so it can have a value from -128 to +127. The EEROM is 1024 bytes, but the first 16 are used only for the servo offsets, so 1008 bytes are available for the user


To read a byte value from location 12 (in reality this is location 28):

```block
Rover.readEEROM(12)
```

To write a value of 49 to location 12:

```block
Rover.writeEEROM(49, 12)
```

There are also blocks to manage the saving and loading of the servo offsets. These are treated as a single block of data, so all offsets are loaded or saved at the same time. You can use these functions to save the servo offsets permanently even after a power off

Load all the stored offsets from EEROM into memory:

```block
Rover.loadOffsets()
```

Save all the offsets from memory into the EEROM:

```block
Rover.saveOffsets()
```

## Read sonar value

If you have mounted the optional sonar sensor for the Robobit you can
also use the `Rover.sonar(..)` function to read the distance to obstacles.

```block
Rover.readSonar(ePingUnit.Centimeters)
```

## FireLed Functions

The MARS Rover has 4 FireLeds. One in each corner. There is a set of commands to control them

Set all FireLeds to Green (hard-coded RGB color):

```block
Rover.setLedColor(0x00FF00)
```

Set all FireLeds to Green (built-in colour selection):

```block
Rover.setLedColor(eColors.Green)
```

Clear all LEDs:

```block
Rover.ledClear()
```

Set LED at position 2 (0 to 3) to Green:

```block
Rover.setPixelColor(2, Rover.eColours(eColors.Green))
```

Set LEDs to a rainbow selection:

```block
Rover.ledRainbow()
```

Set brightness of LEDs to 40 (0 to 255):

```block
Rover.ledBrightness(40)
```

## Supported targets

* for PXT/microbit

## License

MIT
