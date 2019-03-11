{
  // Drive 100 ms forward
  robobit.motor(BBMotor.All, 1023);
  basic.pause(100);

  // Drive 100 ms reverse
  robobit.motor(BBMotor.All, -1023);
  basic.pause(100);

  // Drive 100 ms forward on left and reverse on right
  robobit.motor(BBMotor.Left, 1023);
  robobit.motor(BBMotor.Right, -1023);
  basic.pause(100);

  // Read left and right line sensor
  basic.showNumber(robobit.readLine(BBLineSensor.Left));
  basic.showNumber(robobit.readLine(BBLineSensor.Right));

  // Read sonar values
  basic.showNumber(robobit.sonar(BBPingUnit.MicroSeconds));
  basic.showNumber(robobit.sonar(BBPingUnit.Centimeters));
  basic.showNumber(robobit.sonar(BBPingUnit.Inches));

}
