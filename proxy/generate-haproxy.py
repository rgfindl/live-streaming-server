import os, sys, getopt
from os.path import abspath, dirname, join, isfile
from jinja2 import Template
def main(argv):
	inputfile = ''
	outputfile = ''
	try:
	  opts, args = getopt.getopt(argv,"hi:o:",["ifile=","ofile="])
	except getopt.GetoptError:
	  print 'generate-haproxy.py -i <inputfile> -o <outputfile>'
	  sys.exit(2)
	for opt, arg in opts:
	  if opt == '-h':
	     print 'generate-haproxy.py -i <inputfile> -o <outputfile>'
	     sys.exit()
	  elif opt in ("-i", "--ifile"):
	     inputfile = arg
	  elif opt in ("-o", "--ofile"):
	     outputfile = arg

	ROOT_DIR = abspath(dirname(__file__))
	template_file = os.path.join(ROOT_DIR, inputfile)
	template = Template(open(template_file).read())
	output = open(outputfile, 'w')
	output.write(template.render(os.environ))
	output.write("\n")
	output.close()
if __name__ == "__main__":
   main(sys.argv[1:])