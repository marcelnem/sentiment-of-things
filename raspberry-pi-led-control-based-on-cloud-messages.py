import RPi.GPIO as GPIO
import time
from socketIO_client import SocketIO, LoggingNamespace

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(18,GPIO.OUT)
GPIO.setup(23,GPIO.OUT)
GPIO.setup(24,GPIO.OUT)

def sentiment_handler(*args):
    print('Sentiment: ', args)
    if 'positive' in args[0]:
        GPIO.output(24, GPIO.LOW)
        print "Green led on!"
        GPIO.output(23, GPIO.HIGH)
    if 'negative' in args[0]:
        GPIO.output(23, GPIO.LOW)
        print "Red led on!"
        GPIO.output(24,GPIO.HIGH)

def client():
    print 'Waiting for connection...'
    GPIO.output(18, GPIO.HIGH)
    socketIO = SocketIO('sentiment-of-things.mybluemix.net', 80, LoggingNamespace)
    socketIO.on('sentiment',sentiment_handler)
    socketIO.wait()
    GPIO.output(18, GPIO.LOW)
    print 'Ending the connection'

if __name__=="__main__":
    client()
