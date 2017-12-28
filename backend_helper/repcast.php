<?php


//echo 'Current PHP version: ' . phpversion();

$repcastdir = './repcast/';
$files = preg_grep('/^([^.])/', scandir($repcastdir));

class RepcastFile { 
	public $size;
	public $name;
	public $path;
	public $type;
}

class RepcastDirectory {
	public $name;
	public $type;
	public $key;
}

class RepcastResponse {
	public $info;
}

$repcastfiles = array();

foreach ($files as $filedir) {
	
	$pathdata = pathinfo($filedir);
	


	$file = NULL;
	
	if (is_dir($filedir)) {
		// This is a directory
		$file = new RepcastDirectory();
		$file->type = "dir";
		$file->name = $filedir;
		$file->key = "";	
	} else {
		// This is a file
		$file = new RepcastFile();
		$file->name = $filedir;
		$file->path = "http://192.168.0.3/UI/data/shares/repcast/" . $filediri;
		$file->type = "file";
		$file->size = 0;
		$file->original = $filedir;
	}

	array_push($repcastfiles, $file);
}


header('Content-Type: application/json');

$repcastresponse = new RepcastResponse();
$repcastresponse->info = $repcastfiles;


echo json_encode($repcastresponse);

?>
