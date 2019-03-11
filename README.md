# Robobit
 Package for Microsoft Makecode

This library provides a Microsoft Makecode package for the Robobit Buggy, see
https://4tronix.co.uk/robobit/

## Driving the robot    
The simplest way to drive robot is by using the `driveMilliseconds(...)` and `driveTurnMilliseconds(...)` blocks.   
Note with `driveMilliseconds(...)`, you can specify a negative speed to reverse.   
```blocks
// Drive forward for 2000 ms
robobit.driveMilliseconds(1023, 2000)

// Drive backwards for 2000 ms
robobit.driveMilliseconds(-1023, 2000)

// Turn left for 200 ms
robobit.driveTurnMilliseconds(BBRobotDirection.Left, 1023, 200)

// Turn right for 200 ms
robobit.driveTurnMilliseconds(BBRobotDirection.Right, 1023, 200)
```   

These blocks are also available in non blocking version. The following example performs the same operation as above.   
```blocks
robobit.drive(1023)
basic.pause(1000)

robobit.drive(0)
basic.pause(1000)

robobit.driveTurn(BBRobotDirection.Left, 1023)
basic.pause(250)

robobit.driveTurn(BBRobotDirection.Right, 1023)
basic.pause(250)

robobit.drive(0)
```

## Driving the motor

If you want more fine grain control of individal motors, use `robobit.motor(..)` to drive motor either forward or reverse. The value
indicates speed and is between `-1023` to `1023`. Minus indicates reverse.

```blocks
// Drive 1000 ms forward
robobit.motor(BBMotor.All, 1023);
basic.pause(1000);

// Drive 1000 ms reverse
robobit.motor(BBMotor.All, -1023);
basic.pause(1000);

// Drive 1000 ms forward on left and reverse on right
robobit.motor(BBMotor.Left, 1023);
robobit.motor(BBMotor.Right, -1023);
basic.pause(1000);
```

## Read line sensor

The Robobit (optionally) has two line-sensors: left and right. To read the value of the
sensors, use `robobit.readLine(..)` function.

```blocks
// Read left and right line sensor
let left = robobit.readLine(BBLineSensor.Left);
let right = robobit.readLine(BBLineSensor.Right);
```

## Read sonar value

If you have mounted the optional sonar sensor for the Robobit you can
also use the `robobit.sonar(..)` function to read the distance to obstacles.

```blocks
// Read sonar values
let v1 = robobit.sonar(BBPingUnit.MicroSeconds);
let v2 = robobit.sonar(BBPingUnit.Centimeters);
let v3 = robobit.sonar(BBPingUnit.Inches);
```

## NeoPixel helpers

The Robobit optionally has 8 NeoPixels mounted on a LEDBar. This library defines some helpers
for using the NeoPixels.

```blocks
// Show all leds
robobit.setColor(neopixel.colors(NeoPixelColors.Red));
robobit.neoShow();

// Clear all leds
robobit.neoClear();
robobit.neoShow();

// Show led at position 1 (0 to 7)
robobit.setPixel(1, neopixel.colors(NeoPixelColors.Red));
robobit.neoShow();

// Show led rainbow
robobit.neoRainbow();
robobit.neoShow();

// Show led rainbow and shift
robobit.neoRainbow();
robobit.neoShift();
robobit.neoShow();

// Show led rainbow and rotate
robobit.neoRainbow();
robobit.neoRotate();
robobit.neoShow();

// Set brightness of leds (0 to 255)
robobit.neoBrightness(100);
robobit.neoShow();

// Use scanner update regularly in forever loop
robobit.ledScan();
robobit.neoShow();

// Define your own colours using convertRGB(red, green, blue)
robobit.setColor(robobit.convertRGB(40, 50, 200));
robobit.neoShow();
```

## Supported targets

* for PXT/microbit

## License

MIT
