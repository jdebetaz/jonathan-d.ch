<?php


namespace App\Http\Controllers\Admin;


use App\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController
{

    public function store (Request $request) {
        $file = $request->file('file');
        $year = date('Y');
        $month = date('m');
        $attachment = new Attachment();
        $attachment->filename = $file->getClientOriginalName();
        $attachment->filesize = $file->getSize();
        $attachment->save();
        Storage::putFileAs("/attachments/{$year}", $file, $file->getClientOriginalName());
        return new JsonResponse($attachment);
    }


    public function folders (Request $request) {
        $attachments = Attachment::FindYearsMonths();
        return new JsonResponse($attachments);
    }

    public function files (Request $request) {
        ['path' => $path, 'q' => $q] = $this->getFilterParams($request);
        if (!empty($q)) {
            $attachments = Attachment::search($q);
        } elseif (null === $path) {
            $attachments = Attachment::orderBy('created_at', 'DESC')->limit(25)->get();
        } else {
            $attachments = Attachment::findForPath($request->get('path'));
        }
        return new JsonResponse($attachments);
    }

    private function getFilterParams(Request $request): array
    {
        $req = [];
        $req['path'] = $request->get('path', null);
        $req['q'] = $request->get('q', '');
        return $req;
    }
}
