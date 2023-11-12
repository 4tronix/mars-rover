{
// MOTORS

  // Move forward
  marsRover.move(RVvector.Forward, 60)
  basic.pause(1000);

  // Reverse for 2s
  marsRover.moveMilli(RVvector.Reverse, 70, 2000)

  // Spin Left
  marsRover.spin(RVdirection.Left, 60)
  basic.pause(1000);

  // Stop with Brake
  marsRover.stop(RVstopMode.Coast)
  basic.pause(1000);

// SERVOS

  // Centre all servos
  marsRover.zeroServos(RVservoGroup.All)
  basic.pause(1000);

  // Steer Left
  marsRover.steer(RVdirection.Left, 30)
  basic.pause(1000);

  // Turn mast head to right
  marsRover.setServo(marsRover.servoNumber(RVservos.Mast), 30)
  basic.pause(1000);

// SENSORS

  // Display sonar values
  basic.showNumber(marsRover.readSonar(RVpingUnit.Centimeters))
  basic.pause(1000);

// LEDS
  // Set all LEDs to Red
  marsRover.setLedColor(marsRover.colorSelect(RVcolors.Red))
  basic.pause(1000);

  // Clear all LEDs
  marsRover.ledClear()
  basic.pause(1000);

  // Set LED at position 2 to Green
  marsRover.setPixelColor(2, marsRover.colorSelect(RVcolors.Green))
  basic.pause(1000);

  // Set LEDs to a rainbow selection
  marsRover.ledRainbow()
  basic.pause(1000);

  // Set brightness of LEDs to 100
  marsRover.ledBrightness(100)
  basic.pause(1000);
 
}
