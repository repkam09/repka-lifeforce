<?php

// Define some helper structures to return later
class RepcastFile { 
	public $size;
	public $name;
	public $path;
	public $type;
	public $mimetype;
	public $filetype;
}

class RepcastDirectory {
	public $name;
	public $type;
	public $key;
}

class RepcastResponse {
	public $info;
	public $log;
}

// Create the final response object
$repcastresponse = new RepcastResponse();
$repcastfiles = array();
$repcastresponse->log = array();

// Check for a URL parameter named 'dir'
$urlparam = $_GET['dir'];
$subdir = "";

$repcastdir = './repcast/';

if (isset($urlparam)) {
	$subdir = base64_decode($urlparam);
	//array_push($repcastresponse->log, "Looking in directory " . $subdir);
	$repcastdir = './repcast/' . $subdir;
} else {
	//array_push($repcastresponse->log, "Loading the root directory ");
}

// Remove all dotfiles but get other files
$files = preg_grep('/^([^.])/', scandir($repcastdir));

// Loop through the file structure to get the first layer of files
foreach ($files as $filedir) {
	//array_push($repcastresponse->log, "Starting process on file " . $filedir);
	$pathdata = pathinfo($filedir);

	//array_push($repcastresponse->log, "path data: " . print_r($pathdata, true));

	$file = NULL;
	$fullpath = "/var/www/UI/data/shares/repcast/";
	if (is_dir($fullpath . $filedir)) {
		// This is a directory
		//array_push($repcastresponse->log, $filedir . " is a directory");
		$file = new RepcastDirectory();
		$file->type = "dir";
		$file->name = $filedir;
		$file->key = "?dir=" . base64_encode($filedir);
	} else {
		// This is a file
		//array_push($repcastresponse->log, $filedir . " is a file");

		// Get some file information like extention and mimetype
		$mimetype = mime_content_type($fullpath . $filedir);
		$fileinfo = pathinfo($fullpath . $filedir);
		//array_push($repcastresponse->log, $filedir . " is of type " . $mimetype);

		$file = new RepcastFile();
		$file->name = $filedir;
		$file->path = "http://192.168.0.3/UI/data/shares/repcast/". $subdir . "/" . $filedir;
		$file->type = "file";
		$file->size = 0;
		$file->original = $filedir;
		$file->filetype = $fileinfo['extension'];
		$file->mimetype = "video/" .$fileinfo['extension'];
	}

	array_push($repcastfiles, $file);
}


header('Content-Type: application/json');

$repcastresponse->info = $repcastfiles;


echo json_encode($repcastresponse);

?>
