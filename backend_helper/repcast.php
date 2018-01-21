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

// override the old mimetype thing
function _mime_content_type($filename) {

	$mime_types = array(

		'txt' => 'text/plain',
		'htm' => 'text/html',
		'html' => 'text/html',
		'php' => 'text/html',
		'css' => 'text/css',
		'js' => 'application/javascript',
		'json' => 'application/json',
		'xml' => 'application/xml',
		'swf' => 'application/x-shockwave-flash',
		'flv' => 'video/x-flv',

		// images
		'png' => 'image/png',
		'jpe' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'jpg' => 'image/jpeg',
		'gif' => 'image/gif',
		'bmp' => 'image/bmp',
		'ico' => 'image/vnd.microsoft.icon',
		'tiff' => 'image/tiff',
		'tif' => 'image/tiff',
		'svg' => 'image/svg+xml',
		'svgz' => 'image/svg+xml',

		// archives
		'zip' => 'application/zip',
		'rar' => 'application/x-rar-compressed',
		'exe' => 'application/x-msdownload',
		'msi' => 'application/x-msdownload',
		'cab' => 'application/vnd.ms-cab-compressed',

		// audio/video
		'mp3' => 'audio/mpeg',
		'qt' => 'video/quicktime',
		'mov' => 'video/quicktime',
		'mp4' => 'video/mp4',
		'mkv' => 'video/x-matroska',
		'avi' => 'video/avi',

		// adobe
		'pdf' => 'application/pdf',
		'psd' => 'image/vnd.adobe.photoshop',
		'ai' => 'application/postscript',
		'eps' => 'application/postscript',
		'ps' => 'application/postscript',

		// ms office
		'doc' => 'application/msword',
		'rtf' => 'application/rtf',
		'xls' => 'application/vnd.ms-excel',
		'ppt' => 'application/vnd.ms-powerpoint',

		// open office
		'odt' => 'application/vnd.oasis.opendocument.text',
		'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
	);

	$ext = strtolower(array_pop(explode('.',$filename)));
	if (array_key_exists($ext, $mime_types)) {
		return $mime_types[$ext];
	}
	elseif (function_exists('finfo_open')) {
		$finfo = finfo_open(FILEINFO_MIME);
		$mimetype = finfo_file($finfo, $filename);
		finfo_close($finfo);
		return $mimetype;
	}
	else {
		return 'application/octet-stream';
	}
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
		$mimetype = _mime_content_type($fullpath . $filedir);
		$fileinfo = pathinfo($fullpath . $filedir);
		//array_push($repcastresponse->log, $filedir . " is of type " . $mimetype);

		$file = new RepcastFile();
		$file->name = $filedir;
		$file->path = "http://192.168.0.3/UI/data/shares/repcast/". $subdir . "/" . rawurlencode($filedir);
		$file->type = "file";
		$file->size = 0;
		$file->original = $filedir;
		$file->filetype = $fileinfo['extension'];
		$file->mimetype = $mimetype;
	}

	array_push($repcastfiles, $file);
}


header('Content-Type: application/json');

$repcastresponse->info = $repcastfiles;


echo json_encode($repcastresponse);

?>
