<?php
    $total = 0;
    $files = dirToArray('src');

    $runner = 'live.php';

    if ($_SERVER['DOCUMENT_ROOT'] === 'D:/wamp/www' || $_SERVER['DOCUMENT_ROOT'] === '/Users/rich/Documents')
    {
        $runner = 'debug.php';
    }

    function dirToArray($dir) {

        global $total;
        global $runner;

        $ignore = array('.', '..', 'assets', 'css', 'export', 'fonts', 'js', 'lib', 'src');
        $result = array();
        $root = scandir($dir);
        $dirs = array_diff($root, $ignore);

        foreach ($dirs as $key => $value)
        {
            if (is_dir($dir . DIRECTORY_SEPARATOR . $value))
            {
                $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
            }
            else
            {
                if (substr($value, -3) === '.js')
                // if ($value !== 'index.html' && substr($value, -5) === '.html')
                {
                    $result[] = $value;
                    $total++;
                }
            }
        }

        return $result;
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Phaser Nano Tests</title>
    <link href="css/bootstrap.css" rel="stylesheet">
</head>

<body>

    <div class="container">

        <div class="row">
            <div class="col-lg-12">
                <h1 class="page-header">Phaser Nano Tests</h1>
                <p>Total: <?php echo $total ?> Tests</p>
            </div>
        </div>

<?php
    function buildList($section) {

        global $files;
        global $runner;

        $output = "";

        if ($section)
        {
            $tempFiles = $files[$section];
        }
        else
        {
            $tempFiles = $files;
        }

        $c = 0;

        foreach ($tempFiles as $key => $value)
        {
            if ($c === 0)
            {
?>
        <div class="row">
<?php
            }

            // $value2 = substr($value, 0, -5);
            $value2 = substr($value, 0, -3);
            // $value2 = str_replace("-", " ", $value2);
            $value2 = ucwords($value2);
            // $file = urlencode($value);
            $file = $value;

?>
            <div class="col-md-3 portfolio-item">
                 <a href="<?php echo $runner?>?f=<?php echo $file ?>"><?php echo $value2 ?></a>
            </div>
<?php
            $c++;

            if ($c === 4)
            {
                $c = 0;
            }

            if ($c === 0)
            {
?>
        </div>
<?php
            }

        }

        return $output;

    }

    buildList(false);

?>

        <hr>

        <footer style="margin-top: 100px">
            <div class="row">
                <div class="col-lg-12">
                    <img src="assets/phaser.png" />
                    <p>Copyright &copy; <a href="http://www.photonstorm.com">Photon Storm Limited</a> 2015</p>
                </div>
            </div>
        </footer>

    </div>

    <script src="lib/jquery.js"></script>
    <script src="lib/bootstrap.min.js"></script>

</body>
</html>